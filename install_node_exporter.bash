#!/bin/bash

# noed-exporter 설치
docker run -d \
--name=node_exporter \
--net=host \
--pid=host \
-v "/:/host:ro,rslave" \
quay.io/prometheus/node-exporter:latest \
--path.rootfs=/host


