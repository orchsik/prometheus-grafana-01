# EC2 Ubuntu 환경에서 Prometheus & Grafana 찍먹

## 1-1. Prometheus 설정

- mkdir -p /prometheus/config /promethues/data
- [vim prometheus/config/prometheus.yml](./prometheus.yml)

## 1-2. [참고] 도커 Prometheus 기본 이미지 ID 및 설정 경로 확인

```bash
docker run -rm --name prometheus prom/prometheus:v2.29.2
docker exec -it prometheus sh
id  # id가 65534 라는 것을 확인
docker inspect -f '{{json .Config.Cmd}}' prom/prometheus:v2.29.2 | python3 -mjson.tool # 설정 경로 확인.

```

## 2. Prometheus 설치 by Docker

- [도커 Prometheus 설치 명령어](./install_prometheus_docker.sh)

```bash
docker ps
docker ps -a  # 컨테이너가 생성되었지만 실행되지 않음을 확인
docker logs -f prometheus
docker logs -f prometheus 2>&1 | grep permission # 권한문제가 있음을 확인
chwon -R 65534:65534 /prometheus # 권한 부여
docker restart prometheus # 재시작
docker ps # 컨테이너 정상적으로 작동 확인
```

## 3. 실행한 prometheus 관리 API로 상태 확인

- curl localhost:9090/-/healty -D /dev/stdout  
  -D: 프로토콜의 헤더를 확인. 헤더확인 출력은 표준출력(/dev/stdout)으로
- curl localhost:9090/-/healty -D /dev/stdout
- curl localhost:9090/-/reload -XPOST -D /dev/stdout  
  /prometheus/config/prometheus.yml 수정시 reload를 통해 적용 가능.
- curl localhost:9090/-/quit -XPOST -D /dev/stdout

## 4. node_exporter 설치

1. [도커를 이용한 설치](./install_node_exporter.bash)
2. wget & systemctl을 이용한 설치.(정확한 버전은 https://prometheus.io/download/#node_exporter 참고.)
   > wget https://github.com/prometheus/node_exporter/releases/download/v*/node_exporter-*.*-amd64.tar.gz  
   > tar xvfz node*exporter-*._-amd64.tar.gz  
   > cd node_exporter-_.\_-amd64  
   > ./node_exporter

- systemctl 설정

  ```bash
  echo "OPTION=" > /etc/default/node_exporter # 옵션을 위한 파일 생성
  cat << EOF > /etc/systemd/system/node_exporter.service
  > [Service]
  > User=root
  > EnvironmentFile=/etc/default/node_exporter
  > ExecStart=/opt/node_exporter/node_exporter
  > EOF

  systemctl daemon-reload
  systemctl start node_exporter.service # node_exporter 실행
  ```

## 5. 서비스 디스커버리 설정하기

```bash
cd /prometheus/config/
mkdir sd
# 서비스디스크버리 설정파일이 추가되므로 여러 설정파일을 하나의 링크파일로 관리하기 위해서 파일명 변경
mv prometheus.yml static_sd.yml
vim file_sd.yml
```

- [file_sd.yml](./service_discovery/file_sd.yml)
- docker ps -a prometheus
- Prometheus 재설치 by Docker

9090 / 9100

## 6. Metrics 알아보기 간단한 웹서버를 통해

1. 파이썬 웹서버

- 파이썬 prometheus_client 설치

```bash
apt install -y python3-pip
python3 -m pip install prometheus_client
mkdir agent-python && cd agent-python
vim main.py
```

- [웹서버 코드 작성](./metrics/main.py)
- 테스트

```bash
python3 main.py
watch -n 0.1 'curl -s http://localhost:8080 --http0.9'
watch -n 0.1 'curl -s http://lcoalhost:8001 | grep response'
```

2. Node Express 웹서버

- Express 웹서버 설치

```bash
apt install -y nodejs npm
mkdir agent-node && cd agent-node
npm init -y
npm install express prom-client
vim server.js
```

- [웹서버 코드 작성](./metrics/server.js)
- 테스트

```bash
node server.js
watch -n 0.1 'curl -s http://localhost:8080'
watch -n 0,1 'curl -s http://localhost:8080/metrix'
```
