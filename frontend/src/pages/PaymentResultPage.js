// PaymentResultPage.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

 useEffect(() => {
  const resultCode = params.get("resultCode");

  if (resultCode === "0") {
    alert("Thanh toán thành công");
    navigate("/orders");
  } else {
    alert("Thanh toán thất bại");
    navigate("/checkout");
  }
}, [params, navigate]);

  return <p>Đang xử lý kết quả thanh toán...</p>;
}
