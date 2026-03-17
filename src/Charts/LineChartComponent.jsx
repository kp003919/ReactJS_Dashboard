import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  RadialBarChart, RadialBar, PolarAngleAxis, ComposedChart
} from 'recharts';

function LineChartComponent({ data }) {
  // Convert timestamp to readable time
  const formattedData = data.map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString(),
  }));  

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>   
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />  
          <YAxis />
          <Tooltip />
          <Legend />    
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 
export default LineChartComponent;