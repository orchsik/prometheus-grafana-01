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
  - /prometheus/config/prometheus.yml 수정시 reload를 통해 적용 가능.
- curl localhost:9090/-/quit -XPOST -D /dev/stdout
