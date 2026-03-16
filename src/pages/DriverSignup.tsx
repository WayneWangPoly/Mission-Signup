
import { useState } from "react"

export default function DriverSignup(){
  const [driverId,setDriverId] = useState("")
  const [maxLoad,setMaxLoad] = useState(200)

  return (
    <div style={{fontFamily:"sans-serif",padding:40}}>
      <h2>Driver Signup</h2>

      <div style={{marginTop:20}}>
        Driver ID
        <br/>
        <input value={driverId} onChange={e=>setDriverId(e.target.value)} />
      </div>

      <div style={{marginTop:20}}>
        Max Load
        <br/>
        <input type="number" value={maxLoad} onChange={e=>setMaxLoad(Number(e.target.value))} />
      </div>

      <button style={{marginTop:20}}>
        Submit
      </button>
    </div>
  )
}
