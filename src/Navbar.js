import { Link } from "react-router-dom";
import "./css/Navbar.css";

// Navbar component with links to different pages 
// in the IoT dashboard 
// such as DHT Sensor, GPS, Diagnostics, Alerts, Trends, GPS Map, and RTLS  
// More can be added here. 
export default function Navbar() {
  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/">DHT Sensor</Link></li>              
        <li><Link to="/rtls">RTLS</Link></li>  
        <Link to="/beacons">Beacons</Link>
        <Link to="/control-panel">Control Panel</Link>
        <Link to="/embedded-protocols">Embedded Protocols</Link>


      </ul>
    </nav>
  ); 
}
