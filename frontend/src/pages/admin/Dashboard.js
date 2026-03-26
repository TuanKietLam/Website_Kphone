import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {  LineChart,  Line,  BarChart,  Bar,  XAxis,  YAxis,  CartesianGrid,  Tooltip,  ResponsiveContainer,} from "recharts";
import { getRevenueStatistics, getTopProducts } from "../../utils/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getOrderStatusStatistics } from "../../utils/api";

function AdminDashboard() {

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) 
  );
  const formatMonthYear = (value) => {
    const [year, month] = value.split("-");
    return `Tháng ${month}/${year}`;
  };

    const [orderStatusMonth, setOrderStatusMonth] = useState(
      new Date().toISOString().slice(0, 7)
    );

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["revenue-statistics", dateRange],
    queryFn: () => getRevenueStatistics(dateRange),
  });

  const { data: topProductsData, isLoading: productsLoading } = useQuery({
          queryKey: ["top-products", selectedMonth],
          queryFn: () => getTopProducts({ month: selectedMonth }),
        });

    const { data: orderStatusData, isLoading: statusLoading } = useQuery({
      queryKey: ["order-status", orderStatusMonth],
      queryFn: () => getOrderStatusStatistics({ month: orderStatusMonth }),
    });

const orderStatusChartData = orderStatusData
  ? [
      { status: "Chờ xử lý", value: orderStatusData.pending },
      { status: "Đang xử lý", value: orderStatusData.processing },
      { status: "Đang giao", value: orderStatusData.shipping },
      { status: "Hoàn thành", value: orderStatusData.completed },
      { status: "Đã hủy", value: orderStatusData.cancelled },
    ]
  : [];
  
  const dailyRevenue = revenueData?.dailyRevenue || [];

  /* XUẤT FILE EXCEL — NHIỀU SHEET */
  const exportFullReportExcel = () => {
    if (!dailyRevenue.length && !topProductsData?.topProducts?.length) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const workbook = XLSX.utils.book_new();
    const revenueSheet = dailyRevenue.map((item) => ({
      Ngày: new Date(item.date).toLocaleDateString("vi-VN"),
      "Doanh thu (VNĐ)": item.revenue,
    }));

    const wsRevenue = XLSX.utils.json_to_sheet(revenueSheet);
    wsRevenue["!cols"] = [{ wch: 12 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, wsRevenue, "Doanh thu");

      const topProductSheet =
      topProductsData?.topProducts?.map((p, i) => ({
        STT: i + 1,
        "Tên sản phẩm": p.name,
        "Số lượng bán": p.total_sold,
        "Doanh thu (VNĐ)": p.total_revenue,
      })) || [];

    const wsProducts = XLSX.utils.json_to_sheet(topProductSheet);
    XLSX.utils.book_append_sheet(
      workbook,
      wsProducts,
      `Top sản phẩm ${selectedMonth}`
    );

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const fileName = `bao_cao_tong_hop_${dateRange.from}_den_${dateRange.to}.xlsx`;

    saveAs(new Blob([buffer], { type: "application/octet-stream" }), fileName);

  };

  return (
    <div className="container" style={styles.page}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={styles.title}>Thống kê</h1>

        <button
          onClick={exportFullReportExcel}
          style={{
            padding: "12px 22px",
            background: "#108e29ff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          📘 Xuất báo cáo tổng hợp
        </button>
      </div>

      <div style={styles.dateRange}>
        <label>
          Từ ngày:
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) =>
              setDateRange({ ...dateRange, from: e.target.value })
            }
            style={styles.dateInput}
          />
        </label>
        <label>
          Đến ngày:
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) =>
              setDateRange({ ...dateRange, to: e.target.value })
            }
            style={styles.dateInput}
          />
        </label>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>Tổng doanh thu</h3>
          <p style={styles.statValue}>
            {new Intl.NumberFormat("vi-VN").format(
              revenueData?.totalRevenue || 0
            )}{" "}
            đ
          </p>
        </div>

        <div style={styles.statCard}>
          <h3>Tổng đơn hàng</h3>
          <p style={styles.statValue}>{revenueData?.totalOrders || 0}</p>
        </div>
      </div>

      <div style={styles.chartSection}>
        <h2>Biểu đồ doanh thu</h2>
        {revenueLoading ? (
          <p>Đang tải...</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={dailyRevenue}
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })
                }
              />

              <YAxis
                ticks={[
                  50000000,
                  100000000,
                  200000000,
                  300000000,
                  400000000,
                  500000000,
                ]}
                domain={[0, 500000000]}
                tickFormatter={(v) =>
                  new Intl.NumberFormat("vi-VN").format(v)
                }
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;

                  return (
                    <div
                      style={{
                        background: "#fff",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        border: "1px solid #eee",
                      }}
                    >
                      <div style={{ fontWeight: "600", marginBottom: "6px" }}>
                        {new Date(label).toLocaleDateString("vi-VN")}
                      </div>
                      <div style={{ color: "#6c63ff", fontWeight: "500" }}>
                        Doanh thu:{" "}
                        {new Intl.NumberFormat("vi-VN").format(
                          payload[0].value
                        )}{" "}
                        đ
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6c63ff"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    <div style={styles.dateRange}>
      <label>
          Sản phẩm bán chạy:
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={styles.dateInput}
          />
        </label>
    </div>
        
        <div style={styles.section}>
        <h2>Top sản phẩm bán chạy {formatMonthYear(selectedMonth)}</h2>

          {productsLoading ? (
            <p>Đang tải...</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead style={styles.tableHead}>
                  <tr>
                    <th style={styles.colStt}>STT</th>
                    <th style={styles.colProduct}>Sản phẩm</th>
                    <th style={styles.colQuantity}>Số lượng bán</th>
                    <th style={styles.colRevenue}>Doanh thu</th>
                  </tr>
                </thead>

                <tbody>
                  {topProductsData?.topProducts?.map((p, i) => (
                    <tr
                      key={p.id}
                      style={
                        i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                      }
                    >
                      <td style={styles.cellCenter}>{i + 1}</td>

                      <td style={styles.cellProduct}>
                        {p.name}
                      </td>

                      <td style={styles.cellCenter}>
                        {p.total_sold}
                      </td>

                      <td style={styles.cellRevenue}>
                        {new Intl.NumberFormat("vi-VN").format(p.total_revenue)} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

          <div style={styles.dateRange}>
            <label>
              Trạng thái đơn hàng:
              <input
                type="month"
                value={orderStatusMonth}
                onChange={(e) => setOrderStatusMonth(e.target.value)}
                style={styles.dateInput}
              />
            </label>
          </div>
         <div style={styles.chartSection}>
              <h2>
                Thống kê trạng thái đơn hàng ({formatMonthYear(orderStatusMonth)})
              </h2>

            {statusLoading ? (
              <p>Đang tải...</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={orderStatusChartData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="status" />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Bar dataKey="value" fill="#108e29ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

    </div>
  );
}


const styles = {
  page: { padding: "40px 20px" },
  title: { fontSize: "32px", marginBottom: "30px" },

  dateRange: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },

  dateInput: {
    padding: "8px",
    marginLeft: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },

  statCard: {
    backgroundColor: "#f8f9fa",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center",
  },

  statValue: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#007bff",
  },
  chartSection: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    marginBottom: "40px",
  },
  section: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    marginBottom: "40px",
  },
  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },

  tableHead: {
    backgroundColor: "#f8f9fa",
  },
  tableRowEven: { backgroundColor: "#ffffff" },
  tableRowOdd: { backgroundColor: "#f8f9fa" },
  colStt: {
    padding: "16px",
    width: "60px",
    textAlign: "center",
    fontWeight: "600",
    borderBottom: "2px solid #dee2e6",
  },

  colProduct: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "600",
    borderBottom: "2px solid #dee2e6",
  },

  colQuantity: {
    padding: "16px",
    width: "140px",
    textAlign: "center",
    fontWeight: "600",
    borderBottom: "2px solid #dee2e6",
  },

  colRevenue: {
    padding: "16px",
    width: "180px",
    textAlign: "right",
    fontWeight: "600",
    borderBottom: "2px solid #dee2e6",
  },
  cellCenter: {
    padding: "16px",
    textAlign: "center",
    borderBottom: "1px solid #e9ecef",
    fontWeight: "500",
  },

  cellProduct: {
    padding: "16px",
    borderBottom: "1px solid #e9ecef",
    fontWeight: "600",
    color: "#000000ff",
  },

  cellRevenue: {
    padding: "16px",
    textAlign: "right",
    borderBottom: "1px solid #e9ecef",
    fontWeight: "600",
    color: "#28a745",
  },
};


export default AdminDashboard;
