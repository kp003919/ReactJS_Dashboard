import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

function BarChartComponent({ data }) {
  // Convert timestamp to readable time
  const formattedData = data.map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString(),
  }));    

  return (        
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>   
        <BarChart data={formattedData}>   
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />  
          <YAxis />       

          <Tooltip />
          <Legend />      
          <Bar dataKey="temperature" fill="#007bff" name="Temperature (°C)" />
          <Bar dataKey="humidity" fill="#28a745" name="Humidity (%)" />
        </BarChart>     
      </ResponsiveContainer>
    </div>
  );
}   
export default BarChartComponent;