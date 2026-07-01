"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, AlertTriangle, CheckCircle, HeartPulse, 
  Edit3, X, Save, Calendar, User, Ruler, Scale, Activity 
} from "lucide-react";

// ⚠️ CẤU HÌNH TẠI ĐÂY: Sửa lại cho đúng port FastAPI của bạn
const API_BASE_URL = "http://127.0.0.1:8000"; 

interface UserProfileData {
  age: number | string;
  sex: number | string; // 0: Nữ, 1: Nam
  height: number | string;
  weight: number | string;
  blood_pressure: number | string;
  cholesterol: number | string;
}

export function ProfileForm() {
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Trạng thái bật/tắt chế độ chỉnh sửa
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [username, setUsername] = useState("");
  
  // Dữ liệu gốc lưu từ Backend
  const [profile, setProfile] = useState<UserProfileData>({
    age: "", sex: "1", height: "", weight: "", blood_pressure: "", cholesterol: ""
  });

  // Dữ liệu tạm thời khi người dùng đang gõ trong Form chỉnh sửa
  const [formData, setFormData] = useState<UserProfileData>({
    age: "", sex: "1", height: "", weight: "", blood_pressure: "", cholesterol: ""
  });

  const fetchProfile = async () => {
    setIsFetching(true);
    setError("");
    try {
      const storedUsername = localStorage.getItem("username") || "Khách hàng";
      setUsername(storedUsername);

      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      if (!token) {
        setError("Yêu cầu mã xác thực xác minh tài khoản.");
        return;
      }

      // Gọi API lấy thông tin từ Backend
      const res = await fetch(`${API_BASE_URL}/information/me`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Lỗi kết nối: Server trả về giao diện HTML thay vì dữ liệu JSON.");
      }

      if (!res.ok) throw new Error("Không thể đồng bộ hồ sơ sinh học nền tảng.");
      
      const data = await res.json();
      if (data) {
        const standardData = {
          age: data.age ?? "Chưa cập nhật",
          sex: data.sex !== undefined ? String(data.sex) : "1",
          height: data.height ?? "Chưa cập nhật",
          weight: data.weight ?? "Chưa cập nhật",
          blood_pressure: data.blood_pressure ?? "Chưa cập nhật",
          cholesterol: data.cholesterol ?? "Chưa cập nhật"
        };
        setProfile(standardData);
        setFormData(standardData); // Đồng bộ luôn vào form tạm
      }
    } catch (err: any) {
      setError(err.message || "Lỗi đồng bộ hồ sơ.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Bật chế độ sửa: Copy dữ liệu thật sang dữ liệu form tạm
  const handleStartEdit = () => {
    setFormData({
      age: profile.age === "Chưa cập nhật" ? "" : profile.age,
      sex: profile.sex,
      height: profile.height === "Chưa cập nhật" ? "" : profile.height,
      weight: profile.weight === "Chưa cập nhật" ? "" : profile.weight,
      blood_pressure: profile.blood_pressure === "Chưa cập nhật" ? "" : profile.blood_pressure,
      cholesterol: profile.cholesterol === "Chưa cập nhật" ? "" : profile.cholesterol,
    });
    setError("");
    setSuccess("");
    setIsEditing(true);
  };

  // Hủy chế độ sửa: Quay về trạng thái xem ban đầu
  const handleCancelEdit = () => {
    setIsEditing(false);
    setError("");
  };

  // Gửi dữ liệu cập nhật lên Backend
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      
      const payload = {
        age: formData.age !== "" ? parseInt(String(formData.age)) : null,
        sex: parseInt(String(formData.sex)),
        height: formData.height !== "" ? parseFloat(String(formData.height)) : null,
        weight: formData.weight !== "" ? parseFloat(String(formData.weight)) : null,
        blood_pressure: formData.blood_pressure !== "" ? parseInt(String(formData.blood_pressure)) : null,
        cholesterol: formData.cholesterol !== "" ? parseInt(String(formData.cholesterol)) : null,
      };

      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Lỗi kết nối: Server cập nhật trả về giao diện HTML.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Cập nhật thất bại.");
      
      setSuccess("Cập nhật dữ liệu hồ sơ sức khỏe nền tảng thành công!");
      setIsEditing(false); // Tắt chế độ sửa, quay về màn hình hiển thị
      fetchProfile(); // Tải lại dữ liệu mới nhất từ DB lên màn hình
    } catch (err: any) {
      setError(err.message || "Lỗi lưu thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-2" />
        <p className="text-xs">Đang tải cấu trúc dữ liệu sinh học...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl font-sans">
      <Card className="border-0 shadow-xl ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        
        {/* Banner Top */}
        <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-inner">
                <HeartPulse className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Chỉ Số Sinh Học Cá Nhân</CardTitle>
                <CardDescription className="text-rose-100/90 text-xs mt-0.5">
                  Tài khoản: <span className="font-mono font-bold underline bg-white/10 px-1.5 py-0.5 rounded ml-0.5 text-white">{username}</span>
                </CardDescription>
              </div>
            </div>

            {/* Nút kích hoạt chế độ sửa (Chỉ hiện khi đang ở chế độ xem) */}
            {!isEditing && (
              <Button onClick={handleStartEdit} className="bg-white text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs gap-1.5 shadow-md self-start sm:self-auto">
                <Edit3 className="h-3.5 w-3.5" /> Chỉnh sửa hồ sơ
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Nội dung chính */}
        <CardContent className="p-6 bg-white">
          
          {/* CHẾ ĐỘ 1: CHỈ HIỂN THỊ (READ-ONLY) */}
          {!isEditing ? (
            <div className="space-y-6">
              
              {/* Nhóm 1: Thể trạng */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full"></span> Chỉ số hình thể hiện tại
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Tuổi tác</p>
                      <p className="text-sm font-bold text-slate-800">{profile.age} {typeof profile.age === 'number' ? 'tuổi' : ''}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Ruler className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Chiều cao</p>
                      <p className="text-sm font-bold text-slate-800">{profile.height} {typeof profile.height === 'number' ? 'cm' : ''}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Scale className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Cân nặng</p>
                      <p className="text-sm font-bold text-slate-800">{profile.weight} {typeof profile.weight === 'number' ? 'kg' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nhóm 2: Tim mạch */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full"></span> Thông số tuần hoàn lâm sàng
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <User className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Giới tính sinh học</p>
                      <p className="text-sm font-bold text-slate-800">{profile.sex === "1" ? "Nam giới" : "Nữ giới"}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Activity className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Huyết áp lúc nghỉ</p>
                      <p className="text-sm font-bold text-slate-800">{profile.blood_pressure} {typeof profile.blood_pressure === 'number' ? 'mmHg' : ''}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <HeartPulse className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Cholesterol huyết thanh</p>
                      <p className="text-sm font-bold text-slate-800">{profile.cholesterol} {typeof profile.cholesterol === 'number' ? 'mg/dl' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback thông báo thành công khi vừa lưu xong */}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs mt-4">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}
            </div>
          ) : (
            
            /* CHẾ ĐỘ 2: ĐIỀN FORM CHỈNH SỬA (EDIT MODE) */
            <form onSubmit={handleUpdate} className="space-y-6">
              
              {/* Form Nhóm 1 */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full"></span> Thay đổi thông số thể hình
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Tuổi hiện tại</Label>
                    <Input type="number" placeholder="Ví dụ: 24" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="rounded-xl border-slate-200 text-sm focus-visible:ring-rose-500" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Chiều cao (cm)</Label>
                    <Input type="number" step="0.1" placeholder="Ví dụ: 172" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="rounded-xl border-slate-200 text-sm focus-visible:ring-rose-500" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Cân nặng (kg)</Label>
                    <Input type="number" step="0.1" placeholder="Ví dụ: 68" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="rounded-xl border-slate-200 text-sm focus-visible:ring-rose-500" required />
                  </div>
                </div>
              </div>

              {/* Form Nhóm 2 */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full"></span> Thay đổi thông số tuần hoàn
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Giới tính sinh học</Label>
                    <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} className="w-full h-10 px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
                      <option value="1">Nam giới (Male)</option>
                      <option value="0">Nữ giới (Female)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Huyết áp (mm Hg)</Label>
                    <Input type="number" placeholder="Cột blood_pressure" value={formData.blood_pressure} onChange={e => setFormData({...formData, blood_pressure: e.target.value})} className="rounded-xl border-slate-200 text-sm focus-visible:ring-rose-500" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Cholesterol (mg/dl)</Label>
                    <Input type="number" placeholder="Cột cholesterol" value={formData.cholesterol} onChange={e => setFormData({...formData, cholesterol: e.target.value})} className="rounded-xl border-slate-200 text-sm focus-visible:ring-rose-500" required />
                  </div>
                </div>
              </div>

              {/* Thông báo lỗi nếu có */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Cụm nút tác vụ Huỷ / Lưu */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isLoading} className="w-full sm:w-1/3 rounded-xl border-slate-200 font-semibold text-xs gap-1.5 h-11">
                  <X className="h-4 w-4" /> Hủy bỏ
                </Button>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-2/3 bg-slate-800 hover:bg-slate-900 text-white font-bold h-11 rounded-xl shadow-md gap-1.5">
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Đang cập nhật cơ sở dữ liệu...</>
                  ) : (
                    <><Save className="h-4 w-4" /> Lưu thông tin mới</>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}