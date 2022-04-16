# 별도의 프레임워크가 아닌 http 웹서버 사용
import http.server 
# 웹서버의 응답 시간 측정을 위해
import time 
# 데이터 수집과 노출을 위해서
# Histogram 으로 보여줄 것이고
# exporter를 오픈하기 위해서 start_http_server
from prometheus_client import Histogram, start_http_server


# 각 버켓에 포함되는 요처의 분포를 볼 histogram 설정
histogram = Histogram(
  'response_time_histogram', # 데이터 이름
  'Response time for a request', # 간략한 설명
  buckets=[0.00028, 0.00030, 0.00032, 0.00034] # 각 지연시간의 버켓 리스트
  
)

# http get 요청 함수
class Handler(http.server.BaseHTTPRequestHandler):
  def do_GET(self):
    start = time.time()
    self.send_response(200)
    self.wfile.write(b"Histogram Test")
    histogram.observe(time.time() - start)
  

if __name__ == "__main__":
  start_http_server(8081)
  server = http.server.HTTPServer(('localhost', 8080), Handler)
  print('Exporter running on 8081')
  print('Server running on 8080')
  server.serve_forever()