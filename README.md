# ĐỒ ÁN TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM
## ĐỀ TÀI SỐ 07: HỆ THỐNG BLOG / CMS PHÂN TÁN (ENTERPRISE BLOG & CMS)

![Docker](https://img.shields.io/badge/Docker-Docker%20Compose-2496ED?logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639?logo=nginx&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-Monitoring-E6522C?logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-Dashboards-F46800?logo=grafana&logoColor=white)
![Loki](https://img.shields.io/badge/Loki-Centralized%20Logs-F46800?logo=grafana&logoColor=white)

---

## 1. Giới thiệu Tổng quan
Dự án triển khai và quản trị một hệ thống **Blog / CMS chuẩn Doanh nghiệp** trên nền tảng Docker Compose. Hệ thống được đóng gói hoàn chỉnh gồm 8 dịch vụ container độc lập, đáp ứng đầy đủ 7 tiêu chí đánh giá khắt khe của môn học:
- **Web App Blog / CMS**: Tự phát triển bằng Node.js (Express + EJS SSR + Modern Enterprise CSS), hỗ trợ đầy đủ CRUD Bài viết, Danh mục, Người dùng, tự sinh JWT Token và mật khẩu ngẫu nhiên 10 chữ cái.
- **Cơ sở dữ liệu**: MySQL 8.0 kèm dữ liệu mẫu chất lượng cao (Seed Data) và công cụ phpMyAdmin.
- **Cổng tiếp nhận Reverse Proxy**: Nginx tích hợp HTTPS tự ký (Self-signed SSL/TLS) và bộ Security Headers chuẩn OWASP.
- **Giám sát Sức khỏe Toàn diện (Observability)**: Prometheus + Grafana với Dashboard tự động hiển thị CPU, Memory, HTTP traffic và MySQL metrics.
- **Quản lý Ghi log Tập trung**: Grafana Loki + Promtail, sẵn sàng với các câu truy vấn LogQL thực tế.
- **Hardening Bảo mật**: Non-root container, Phân tách mạng nội bộ (Network Isolation), Quản trị credentials qua `.env`.

---

## 2. Kiến trúc Hạ tầng Hệ thống

```
                           [ CLIENT BROWSER ]
                                  │
                                  │ (Port 80 / 443 HTTPS)
                                  ▼
                   ┌───────────────────────────────┐
                   │    Nginx Reverse Proxy        │
                   │  (SSL/TLS + Security Headers) │
                   └──────────────┬────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         │ (frontend_net)                                  │ (frontend_net)
         ▼                                                 ▼
┌─────────────────────────┐                      ┌───────────────────┐
│   Blog / CMS Web App    │                      │    phpMyAdmin     │
│   (Port 3000, Non-root) │                      │    (Port 8080)    │
└────────────┬────────────┘                      └─────────┬─────────┘
             │ (backend_net)                               │ (backend_net)
             └────────────────────┬────────────────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │      MySQL 8.0 Database   │
                    │      (blog_cms_db)        │
                    └─────────────┬─────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │ (monitoring_net)       │ (monitoring_net)       │ (monitoring_net)
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐     ┌───────────────────┐
│  Prometheus 9090 │    │ cAdvisor 8081    │     │ MySQL Exporter    │
└────────┬─────────┘    └──────────────────┘     └───────────────────┘
         │
         ▼
┌──────────────────┐             ┌───────────────────────────────────┐
│  Grafana 3001    │◄────────────┤ Loki 3100 ◄─── Promtail (Logs)    │
│  (Dashboards)    │ (Data link) └───────────────────────────────────┘
└──────────────────┘
```

---

## 3. Danh sách Dịch vụ & Cổng truy cập (Endpoints)

| STT | Dịch vụ (Service) | Cổng Host (Port) | Đường dẫn truy cập | Ghi chú |
|---|---|---|---|---|
| 1 | **Blog / CMS Web (HTTP)** | `80` | `http://localhost` | Giao diện công khai qua Nginx |
| 2 | **Blog / CMS Web (HTTPS)** | `443` | `https://localhost` | Bảo mật với SSL tự ký |
| 3 | **Trang Quản trị Admin** | `80 / 443` | `http://localhost/admin` | Dashboard quản trị (Auth JWT) |
| 4 | **phpMyAdmin** | `8080` | `http://localhost:8080` hoặc `http://localhost/phpmyadmin/` | Quản trị CSDL trực quan |
| 5 | **Grafana Dashboard** | `3001` | `http://localhost:3001` | Giám sát tài nguyên & logs |
| 6 | **Prometheus Server** | `9090` | `http://localhost:9090` | Thu thập metrics hệ thống |
| 7 | **cAdvisor** | `8081` | `http://localhost:8081` | Metrics chi tiết từng container |
| 8 | **Loki Log Engine** | `3100` | `http://localhost:3100` | Cổng API nhận log tập trung |

---

## 4. Thông tin Tài khoản Đăng nhập (Mặc định từ .env)

> [!IMPORTANT]
> Tất cả mật khẩu trong hệ thống đều tuân thủ nguyên tắc **chuỗi 10 chữ cái ngẫu nhiên** và được nạp an toàn từ file `.env`.

- **Quản trị viên Blog / CMS (Admin)**:
  - Tài khoản: `admin`
  - Mật khẩu: `MgVKloQkOG`
  - Giao diện đăng nhập tại: `http://localhost/login` (có nút bấm tự động điền tài khoản mẫu).
- **Quản trị CSDL (phpMyAdmin)**:
  - Máy chủ: `mysql_db`
  - Tài khoản thường: `blog_user` / Mật khẩu: `OyzIVfYrlI`
  - Tài khoản root: `root` / Mật khẩu: `sMWXLlqUiV`
- **Quản trị viên Grafana**:
  - Tài khoản: `admin`
  - Mật khẩu: `VdFhJnKbLq`

---

## 5. Hướng dẫn Khởi chạy Hệ thống (1-Click Run)

### Yêu cầu tiên quyết:
- Đã cài đặt **Docker Desktop** (hoặc Docker Engine + Docker Compose v2).

### Các bước thực hiện:

1. **Khởi tạo file cấu hình môi trường**:
   ```bash
   cp .env.example .env
   ```

2. **Xây dựng và khởi chạy toàn bộ 8 services**:
   ```bash
   docker compose up -d --build
   ```

3. **Kiểm tra trạng thái hoạt động của các container**:
   ```bash
   docker compose ps
   ```

4. **Dừng hệ thống khi kết thúc buổi làm việc**:
   ```bash
   docker compose down
   ```

---

## 6. Hướng dẫn Giám sát & Truy vấn LogQL trong Grafana

1. Truy cập Grafana tại `http://localhost:3001` và đăng nhập với tài khoản `admin` / `VdFhJnKbLq`.
2. Vào mục **Dashboards** → chọn dashboard đã nạp sẵn: **"Enterprise Blog System - Health & Metrics Overview"** để xem biểu đồ CPU, RAM, HTTP request rate, và số lượng truy vấn MySQL.
3. Vào mục **Explore** (biểu tượng la bàn) → chọn Data source là **Loki**:
   - **Query 1 (Xem toàn bộ access log của Nginx)**:
     ```logql
     {job="nginx"}
     ```
   - **Query 2 (Lọc các dòng log chứa thông báo lỗi)**:
     ```logql
     {job="nginx"} |= "error"
     ```
   - **Query 3 (Thống kê số lượng log theo mã trạng thái HTTP trong 5 phút)**:
     ```logql
     sum by (status) (count_over_time({job="nginx"} [5m]))
     ```

---

## 7. Các biện pháp Hardening Bảo mật Đã Áp Dụng

1. **Non-root Container Execution**: Ứng dụng Node.js chạy dưới user `appuser` (UID 1001), ngăn ngừa leo thang đặc quyền container.
2. **Docker Network Isolation**: Hệ thống phân tách thành 3 networks:
   - `frontend_net`: Nginx giao tiếp Web App & phpMyAdmin.
   - `backend_net`: Web App & phpMyAdmin kết nối MySQL (Database hoàn toàn không mở cổng ra ngoài internet).
   - `monitoring_net`: Prometheus, Loki, Grafana, cAdvisor và Exporters giao tiếp nội bộ.
3. **Mật khẩu mạnh & Secrets qua Biến môi trường**: Không hardcode mật khẩu trong code, toàn bộ sử dụng chuỗi 10 chữ cái ngẫu nhiên.
4. **Nginx Security Headers**: Thiết lập đầy đủ `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`.
5. **Giấu phiên bản máy chủ**: Thiết lập `server_tokens off;` trên Nginx.

---

## 8. Lịch sử Git Commits (Tuân thủ Yêu cầu Đề bài)
- **Commit 1**: `Cấu hình Nginx làm reverse proxy (có HTTPS tự ký hoặc security headers cơ bản)`
- **Commit 2**: `Tích hợp Prometheus + Grafana để giám sát container, web server và database`
- **Commit 3**: `Triển khai hệ thống log tập trung Loki + Promtail, truy vấn log bằng LogQL (ít nhất 2–3 query)`
