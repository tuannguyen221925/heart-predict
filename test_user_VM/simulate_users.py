import time
import random
import requests

# Cấu hình URL của Backend FastAPI đang chạy
BASE_URL = "http://127.0.0.1:8000"  # Hoặc URL deploy nếu chạy trên cloud

def generate_random_user():
    """Tạo thông tin ngẫu nhiên cho một người dùng."""
    random_id = random.randint(1000, 9999)
    username = f"tuan_user_{random_id}"
    email = f"{username}@gmail.com"
    phone = f"0912{random.randint(100000, 999999)}"
    
    # Mật khẩu thỏa mãn regex: chữ hoa, chữ thường, số, ký tự đặc biệt, chiều dài 9-15
    password = f"Tuan@{random.randint(1000, 9999)}!" 
    
    # Chỉ số sinh học ngẫu nhiên
    profile_data = {
        "age": random.randint(18, 75),
        "sex": random.choice([0, 1]), # 0: Nữ, 1: Nam
        "height": round(random.uniform(150.0, 185.0), 1),
        "weight": round(random.uniform(45.0, 90.0), 1),
        "blood_pressure": random.randint(110, 150),
        "cholesterol": random.randint(150, 280)
    }
    
    return username, password, email, phone, profile_data

def run_simulation(num_users=3, delay_seconds=2):
    """
    Chạy giả lập đăng ký và cập nhật hồ sơ cho nhiều user.
    delay_seconds: Thời gian nghỉ giữa các hành động để nhìn dạng 'Live'
    """
    print(f"🚀 Bắt đầu giả lập LIVE {num_users} người dùng tương tác hệ thống...")
    print("=" * 60)
    
    for i in range(1, num_users + 1):
        username, password, email, phone, profile_data = generate_random_user()
        
        print(f"\n[User #{i}] 🧑‍💻 Giả lập hành vi cho tài khoản: {username}")
        # In trực tiếp mật khẩu thật và email ra để Tuấn copy test Front-end
        print(f"    🔑 [Tài khoản test]: Username: {username} | Password: {password} | Email: {email}")
        time.sleep(delay_seconds)
        
        # 1. GỬI REQUEST ĐĂNG KÝ (POST /register)
        register_url = f"{BASE_URL}/register" # Hoặc endpoint đăng ký thực tế của bạn
        register_payload = {
            "username": username,
            "password": password,
            "confirm_password": password,
            "email": email,
            "phone": phone
        }
        
        try:
            print(f" -> Đang gửi yêu cầu đăng ký...")
            reg_response = requests.post(register_url, json=register_payload)
            
            if reg_response.status_code in [200, 210, 201]:
                print(f" 🎉 Đăng ký THÀNH CÔNG!")
            else:
                print(f" ❌ Đăng ký thất bại: Status {reg_response.status_code} - {reg_response.text}")
                continue # Thất bại thì bỏ qua user này
                
        except Exception as e:
            print(f" ❌ Lỗi kết nối Backend khi đăng ký: {e}")
            break
            
        time.sleep(delay_seconds)
        
        # 2. GỬI REQUEST ĐĂNG NHẬP ĐỂ LẤY TOKEN (POST /login)
        login_url = f"{BASE_URL}/login" # Hoặc endpoint login dạng Form/Json
        # Nếu FastAPI dùng OAuth2 chuẩn (như trong auth.py tokenUrl="/login"), payload truyền dạng data (form-urlencoded)
        login_data = {
            "username": username,
            "password": password
        }
        
        token = None
        print(f" -> Đang tiến hành đăng nhập vào hệ thống...")
        try:
            # Test thử gửi dạng form trước, nếu backend nhận JSON thì sửa thành json=login_data
            login_response = requests.post(login_url, data=login_data) 
            if login_response.status_code == 200:
                token = login_response.json().get("access_token")
                print(f" 🔑 Đăng nhập thành công! Nhận Token thành công.")
            else:
                # Thử lại bằng JSON đề phòng API nhận JSON body
                login_response = requests.post(login_url, json=login_data)
                if login_response.status_code == 200:
                    token = login_response.json().get("access_token")
                    print(f" 🔑 Đăng nhập thành công! Nhận Token thành công.")
                else:
                    print(f" ❌ Đăng nhập thất bại: {login_response.text}")
                    continue
        except Exception as e:
            print(f" ❌ Lỗi khi đăng nhập: {e}")
            continue
            
        time.sleep(delay_seconds)
        
        # 3. GỬI REQUEST CẬP NHẬT CHỈ SỐ SINH HỌC (PUT /user/profile hoặc tương ứng)
        if token:
            profile_url = f"{BASE_URL}/user/profile" # Tuấn đổi lại đúng endpoint cập nhật Profile của bạn nhé
            headers = {"Authorization": f"Bearer {token}"}
            
            print(f" -> Đang cập nhật chỉ số sinh học lên bảng user_information...")
            print(f"    [Dữ liệu cập nhật]: Tuổi: {profile_data['age']} | Cân nặng: {profile_data['weight']}kg | Huyết áp: {profile_data['blood_pressure']}")
            
            try:
                prof_response = requests.put(profile_url, json=profile_data, headers=headers)
                if prof_response.status_code == 200:
                    print(f" ✅ Cập nhật thông tin hồ sơ và lưu DB THÀNH CÔNG!")
                else:
                    print(f" ❌ Cập nhật hồ sơ lỗi: Status {prof_response.status_code} - {prof_response.text}")
            except Exception as e:
                print(f" ❌ Lỗi khi gọi API cập nhật: {e}")
                
        print("-" * 40)
        time.sleep(delay_seconds * 1.5)

    print("\n🏁 Hoàn thành đợt chạy giả lập Live!")

if __name__ == "__main__":
    # Đảm bảo uvicorn đang chạy trước khi chạy file này nha Tuấn
    run_simulation(num_users=3, delay_seconds=2)