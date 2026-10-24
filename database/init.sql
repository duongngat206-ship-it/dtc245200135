CREATE DATABASE IF NOT EXISTS `blog_cms_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `blog_cms_db`;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'author', 'reader') NOT NULL DEFAULT 'author',
  `avatar` VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `color_badge` VARCHAR(20) DEFAULT '#2563eb',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Posts table
CREATE TABLE IF NOT EXISTS `posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `summary` TEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `cover_image` VARCHAR(500) DEFAULT NULL,
  `category_id` INT NULL,
  `author_id` INT NOT NULL,
  `status` ENUM('published', 'draft', 'archived') NOT NULL DEFAULT 'published',
  `views` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_posts_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `color_badge`) VALUES
(1, 'DevOps & Quản trị Hệ thống', 'devops-quan-tri-he-thong', 'Các kiến thức về Docker, Kubernetes, CI/CD và tối ưu hóa hạ tầng máy chủ', '#0ea5e9'),
(2, 'Kiến trúc Phần mềm', 'kien-truc-phan-mem', 'Thiết kế hệ thống phân tán, Microservices, Clean Architecture và Design Patterns', '#8b5cf6'),
(3, 'Bảo mật & Giám sát', 'bao-mat-giam-sat', 'Thực hành Hardening hệ thống, Prometheus, Grafana và phân tích log tập trung Loki', '#ef4444'),
(4, 'Phát triển Backend', 'phat-trien-backend', 'Công nghệ Node.js, REST API, Database indexing và tối ưu hóa truy vấn', '#10b981')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Thêm Bài viết mẫu chất lượng cao
INSERT INTO `posts` (`id`, `title`, `slug`, `summary`, `content`, `cover_image`, `category_id`, `author_id`, `status`, `views`, `created_at`) VALUES
(1, 
 'Tối ưu hóa Docker Container và Triển khai Đa tầng với Nginx Reverse Proxy', 
 'toi-uu-hoa-docker-container-va-trien-khai-nginx-reverse-proxy',
 'Khám phá các kỹ thuật đóng gói ứng dụng containerized nhẹ, an toàn và thiết lập Nginx làm cổng tiếp nhận lưu lượng tập trung.',
 '## 1. Giới thiệu tổng quan\n\nTrong kỷ nguyên Cloud Native, việc đóng gói ứng dụng bằng Docker và định tuyến qua Nginx Reverse Proxy đã trở thành tiêu chuẩn vàng của các doanh nghiệp.\n\n### Lợi ích cốt lõi:\n- **Cô lập môi trường (Isolation)**: Giúp ứng dụng hoạt động nhất quán giữa môi trường Development, Staging và Production.\n- **Bảo mật**: Nginx giấu kín thông tin hạ tầng nội bộ, chấm dứt kết nối SSL/TLS và lọc các yêu cầu nguy hiểm bằng Security Headers.\n- **Tải trọng cao**: Khả năng chịu tải vượt trội của Nginx giúp giảm áp lực trực tiếp lên application servers.\n\n## 2. Các bước cấu hình Nginx tối ưu\nViệc cấu hình Nginx cần lưu ý các chỉ thị như `proxy_set_header`, thiết lập bộ đệm và giới hạn kích thước request body để tránh tấn công DoS.',
 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=1200&q=80',
 1, 1, 'published', 142, NOW() - INTERVAL 5 DAY),

(2, 
 'Xây dựng Hệ thống Giám sát Toàn diện với Prometheus và Grafana', 
 'xay-dung-he-thong-giam-sat-toan-dien-voi-prometheus-va-grafana',
 'Hướng dẫn từng bước thu thập metrics từ container, web server, database và hiển thị trực quan trên Grafana Dashboard.',
 '## 1. Tầm quan trọng của Observability\n\nKhông có hệ thống nào hoạt động an toàn mà thiếu đi đôi mắt giám sát. Prometheus hoạt động theo cơ chế pull-based scraping, thu thập các chỉ số định lượng theo chu kỳ.\n\n### Các chỉ số then chốt (Golden Signals):\n1. **Latency**: Thời gian phản hồi của các API endpoint.\n2. **Traffic**: Tần suất truy vấn (Requests per second).\n3. **Errors**: Tỷ lệ lỗi 4xx và 5xx trên tổng số request.\n4. **Saturation**: Độ bão hòa tài nguyên CPU, RAM, Disk I/O.\n\n## 2. Tích hợp Grafana Dashboard\nGrafana giúp biến các dòng dữ liệu thời gian (Time-series) khô khan thành những đồ thị sống động, hỗ trợ cảnh báo tức thì khi có sự cố hạ tầng.',
 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
 3, 1, 'published', 256, NOW() - INTERVAL 3 DAY),

(3, 
 'Thu thập Log Tập trung với Grafana Loki và Ngôn ngữ Truy vấn LogQL', 
 'thu-thap-log-tap-trung-voi-grafana-loki-va-logql',
 'Giải pháp thay thế ELK stack gọn nhẹ: cách Promtail gửi log về Loki và kỹ thuật viết câu truy vấn LogQL hiệu quả.',
 '## 1. Tại sao Loki là giải pháp tối ưu cho hệ thống nhỏ và vừa?\n\nKhác với Elasticsearch đánh chỉ mục (index) toàn bộ văn bản của log khiến tốn kém bộ nhớ, Grafana Loki chỉ đánh chỉ mục các nhãn (labels), còn nội dung log được nén và lưu trữ hiệu quả.\n\n### 2. Các cú pháp LogQL cơ bản bạn phải biết:\n- Lọc log theo container: `{container_name=\"blog_app\"}`\n- Tìm kiếm từ khóa lỗi: `{job=\"nginx\"} |= \"error\"`\n- Đếm số lượng log lỗi trong 5 phút: `sum(count_over_time({job=\"nginx\"} |= \"error\" [5m]))`\n\nViệc kết hợp Loki cùng Grafana tạo nên trải nghiệm thống nhất giữa Metrics và Logs trên cùng một giao diện.',
 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
 3, 1, 'published', 389, NOW() - INTERVAL 2 DAY),

(4, 
 'Kỹ thuật Hardening Hệ thống: Bảo mật Đa lớp cho Ứng dụng Docker', 
 'ky-thuat-hardening-he-thong-bao-mat-da-lop-cho-docker',
 'Thực hành các nguyên tắc bảo mật tối thượng: Non-root container, Network Isolation, Quản lý Secret và HTTP Headers an toàn.',
 '## 1. Nguyên tắc đặc quyền tối thiểu (Least Privilege)\n\nMột trong những sai lầm phổ biến nhất khi viết Dockerfile là để tiến trình chạy dưới quyền `root`. Nếu ứng dụng bị khai thác lỗ hổng Remote Code Execution (RCE), kẻ tấn công sẽ chiếm trọn quyền kiểm soát container.\n\n### 2. Các biện pháp Hardening áp dụng ngay:\n- **Tạo unprivileged user**: Sử dụng lệnh `USER node` hoặc `USER 1001` trong Dockerfile.\n- **Network Isolation**: Tách biệt mạng `frontend_net`, `backend_net` và `monitoring_net`. Database chỉ giao tiếp với Backend, tuyệt đối không mở port ra môi trường bên ngoài.\n- **Quản lý Secrets chặt chẽ**: Không commit `.env` lên GitHub, luôn dùng biến môi trường để nạp mật khẩu mạnh.\n- **Security Headers trên Nginx**: Cấu hình `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`.',
 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
 1, 1, 'published', 512, NOW() - INTERVAL 1 DAY),

(5, 
 'Thiết kế RESTful API Chuẩn Doanh nghiệp và Xác thực qua JWT Token', 
 'thiet-ke-restful-api-chuan-doanh-nghiep-va-xac-thuc-jwt',
 'Chi tiết kiến trúc xác thực Stateless với JSON Web Token, bảo vệ Endpoint quản trị và phân quyền người dùng đa cấp độ.',
 '## 1. Cơ chế hoạt động của JWT (JSON Web Token)\n\nJWT cho phép xác thực phi trạng thái (stateless), chia sẻ danh tính an toàn giữa client và server thông qua chuỗi mã hóa gồm 3 phần: Header, Payload và Signature.\n\n### Quy trình xác thực an toàn:\n1. Người dùng gửi thông tin đăng nhập (Username / Password).\n2. Server kiểm tra mật khẩu bằng thuật toán băm Bcrypt kèm salt.\n3. Nếu hợp lệ, Server ký tạo JWT với secret key an toàn và gửi về cho Client qua HttpOnly Cookie hoặc Authorization Header.\n4. Mọi request tiếp theo vào Admin Dashboard đều được middleware kiểm tra chữ ký token trước khi cấp quyền truy cập.',
 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
 4, 1, 'published', 215, NOW())
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);
