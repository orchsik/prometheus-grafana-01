docker run -d \
--name=grafana \
--net=host \
-v /grafana/config:/etc/grafana \
-v /grafana/data:/var/lib/grafana \
grafana/grafana:8.1.2