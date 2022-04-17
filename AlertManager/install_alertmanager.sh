docker run -d \
--net=host \
--name alertmanager \
-v /alertmanager/config:/etc/alertmanager \
quay.io/prometheus/alertmanager