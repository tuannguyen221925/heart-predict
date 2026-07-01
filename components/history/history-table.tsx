"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Heart, Loader2, AlertTriangle, RefreshCw, 
  Search, Calendar, Activity, CheckCircle2
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000"; 

interface HistoryItem {
  id: number;
  name_prediction: string;
  prediction_result: number; 
  risk_level: string;
  timestamp: string | null;
}

export function HistoryTable() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");

      if (!token) {
        setError("Vui lòng đăng nhập để xem lịch sử chẩn đoán.");
        return;
      }

      // Đã nối thêm API_BASE_URL để gọi chính xác sang Backend FastAPI
      const response = await fetch(`${API_BASE_URL}/history_predictions`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      // Kiểm tra nếu response trả về HTML thay vì JSON để báo lỗi tường minh
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(`Lỗi kết nối: Server trả về HTML thay vì dữ liệu JSON. Vui lòng kiểm tra lại cấu hình API_BASE_URL hoặc cấu hình Router Prefix trên Backend.`);
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Không thể tải dữ liệu lịch sử");
      
      setHistory(data);
      setFilteredHistory(data);
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối đến máy chủ hệ thống.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const results = history.filter(item => 
      item.name_prediction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.risk_level?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredHistory(results);
  }, [searchTerm, history]);

  const getRiskStyles = (level: string) => {
    switch (level?.toUpperCase()) {
      case "THẤP": return "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm";
      case "TRUNG BÌNH": return "bg-amber-50 text-amber-700 border-amber-200 shadow-sm";
      case "CAO": return "bg-orange-50 text-orange-700 border-orange-200 shadow-sm";
      case "RẤT CAO": return "bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse shadow-sm";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl font-sans">
      <Card className="border-0 shadow-xl ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                <Heart className="h-5 w-5 text-rose-400 fill-rose-400/20" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Nhật Ký Tầm Soát Tim Mạch</CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-0.5">Lưu trữ kết quả đánh giá lâm sàng từ hệ thống Học Máy.</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchHistory} disabled={isLoading} className="rounded-xl border-white/20 text-white bg-white/5 hover:bg-white/10 self-start sm:self-auto gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Tải lại dữ liệu
            </Button>
          </div>
        </CardHeader>

        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input type="text" placeholder="Tìm tên bản ghi, mức độ nguy cơ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 rounded-xl border-slate-200 bg-white focus-visible:ring-rose-500 text-sm" />
          </div>
        </div>

        <CardContent className="p-0 bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-2" />
              <p className="text-xs">Đang đồng bộ hồ sơ bệnh án...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 bg-rose-50/50 m-4 rounded-xl border border-rose-100 text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm">Không tìm thấy dữ liệu nhật ký chẩn đoán nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100">
                    <th className="px-6 py-3.5">Mã số</th>
                    <th className="px-6 py-3.5">Tên Bản Ghi / Triệu Chứng</th>
                    <th className="px-6 py-3.5">Thời Gian Phân Tích</th>
                    <th className="px-6 py-3.5">Trạng Thái Kết Quả AI</th>
                    <th className="px-6 py-3.5">Mức Nguy Cơ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#HG-{item.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{item.name_prediction || "Đánh giá định kỳ"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{item.timestamp ? new Date(item.timestamp).toLocaleString("vi-VN") : "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.prediction_result === 1 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            <Activity className="h-3.5 w-3.5" /> Phát hiện bất thường
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Hệ tim mạch ổn định
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border uppercase ${getRiskStyles(item.risk_level)}`}>
                          {item.risk_level || "Chưa xác định"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}