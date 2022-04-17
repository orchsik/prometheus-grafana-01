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

7. PushGateway

1) [prom/pushgateway 설치](./pushgateway/install_push_gateway.sh)
2) [ss-nltp](ss-nltp)
   - 9091 포트에 PushGateway가 정상적으로 실행되는것을 확인할 수 있다.
3) PushGateway 설정 적용

   ```bash
   cd /prometheus/config
   vim pushgateway.yml
   ln -sf pushgateway.yml prometheus.yml
   curl http://localhost:9090/-/reload -XPOST -D /dev/stdout # 프로메테우스 리로드를 통해 설정 적용
   ```

   - [pushgateway.yml](./pushgateway/pushgateway.yml)

4) PushGateway에 데이터 넣기

   ```bash
   echo "test_metric 1" | curl --data-binary @- http://localhost:9091/metrics/job/test_job
   # 아래와 같이 입력하고 싶은 데이터를 추가할 수 있다.
   echo "test_metric 1" | curl --data-binary @- http://localhost:9091/metrics/job/test_job/instance/test_job
   ```

5) Node Express를 이용한 실습
   ```bash
   cd /prometheus
   mkdir batch && cd batch
   npm init -y
   npm i waait prom-client
   vim worker.js
   watch -n 5 'node worker.js'
   ```
   - [worker.js](./pushgateway/worker.js)
   - http://########:9090/graph 에서 "batch_process_time_second[1m]" 쿼리로 확인 가능.

8.  AlertManager

    1. Prometheus에 AlertManager 설정하기

       ```bash
       vim /prometheus/config/alerting.yml
       ```

    - [alerting.yml](./AlertManager/alerting.yml)

    2.  alert rules 설정하기

        ```bash
        mkdir rules
        vim rules/ex.yml
        ```

        - [ex.yml](./AlertManager//ex.yml)
        - [다양한 rules](https://awesome-prometheus-alerts.grep.to/rules)

    3.  설정 적용

        ```bash
        cd /prometheus/config
        ln -sf alerting.yml prometheus.yml
        curl http://localhost:9090/-/reload -XPOST -D /dev/stdout
        ```

    4.  AlertManager 설치

        ```bash
        mkdir -p /alertmanager/config
        vim alertmanager.yml
        ```

        - [alertmanager.yml](./AlertManager//alertmanager.yml)
        - [docker로 AlertManager 설치](./AlertManager/install_alertmanager.sh)
        - 설치된 것을 확인
          - docker ps
          - http:localhost:9093/#/alerts

    5.  사용

        - AlertManager는 API를 사용해서 Prometheus와 통신함.
        - [API 목록](https://github.com/prometheus/alertmanager/blob/main/api/v2/openapi.yaml) - 예시
          ```bash
          curl -X 'POST' \
          'http://localhost:9093/api/v2/alerts' \
          -H 'accept: application/json' \
          -H 'Content-Type: application/json' \
          -d '[{
            "startsAt": "2022-04-17T10:25:32.534Z",
            "endsAt": "2022-04-18T10:25:32.534Z",
            "annotations": { "summary": "test" },
            "labels": { "alertname": "test" }
          }]'
          ```
