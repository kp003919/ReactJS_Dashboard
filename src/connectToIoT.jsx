import mqtt from "mqtt/dist/mqtt.min.js";
import { getSignedUrl } from "./SigV4Utils";
// Function to connect to AWS IoT using MQTT over WebSockets with SigV4 signing
// and return the MQTT client instance
//  endpoint: AWS IoT endpoint URL
//  clientId: Unique client identifier
//  options: Additional MQTT connection options 
//  returns: MQTT client instance 
// Example usage:
//  const client = connectToIoT(endpoint, clientId, options); 

export function connectToIoT(endpoint, clientId, options) {
  const client = mqtt.connect(endpoint, {
    clientId,
    ...options
  });


  // Event handlers 
  // Log connection status
  // Log incoming messages  
  // on successful connection
  client.on("connect", () => {
    console.log("Connected to AWS IoT");
  });


   // on receiving a message  
   // log the topic and message payload
   // when a message is received
   // log the topic and message payload
   // when a message is received
   
  client.on("message", (topic, message) => {
    console.log("Received:", topic, message.toString());
  });

  // Return the MQTT client instance  
  return client;
}
