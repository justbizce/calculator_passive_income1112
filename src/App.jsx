import { useState } from "react";

export default function App() {
  const [income, setIncome] = useState(50000);
  const required = Math.round(income / 0.13);

  return (
    <div style={{background:"#020617",color:"white",minHeight:"100vh",padding:"40px"}}>
      <h1>Пассивный доход</h1>
      <input value={income} onChange={(e)=>setIncome(Number(e.target.value))}/>
      <h2>Нужно вложить:</h2>
      <h1>{required.toLocaleString()} ₽</h1>
    </div>
  );
}
