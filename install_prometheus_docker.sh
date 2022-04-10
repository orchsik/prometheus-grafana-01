#!/bin/bash

# prometheus 도커 설치 명령어
docker run \
-d \ # 백그라라운드 실행을 위한 옵션
--name=prometheus \ # 컨테이너이름 설정
--net=host \ # network 호스트로 주기(prometheus 기본 9090)
-v /prometheus/config:/etc/prometheus \ # 설정 데이터 유실을 피하기 위한 볼륨 설정
-v /prometheus/data:/data \ # prometheus data
prom/prometheus:v2.292 \ # 설치할 프로메테우스 이미지
--config.file=/etc/prometheus/prometheus.yml \
--storage.tsdb.path=/data
--web.enable-lifecycle # reload quit 와 같은 명령어 사용 가능.
--storage.tsdeb.retention.time=20d # retention.time 설정.