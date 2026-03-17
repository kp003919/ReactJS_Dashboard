import { Amplify } from "aws-amplify";
import { AWSIoTProvider } from "@aws-amplify/pubsub";

Amplify.configure({
  Auth: {
    identityPoolId: "eu-west-2:62e6c7b7-bd74-43bc-8b55-007a8a972d22",
    region: "eu-west-2"
  }
});

// Add the IoT provider AFTER Amplify.configure
Amplify.addPluggable(
  new AWSIoTProvider({
    aws_pubsub_region: "eu-west-2",
    aws_pubsub_endpoint:
      "wss://a3cv66lhwjj8z4-ats.iot.eu-west-2.amazonaws.com/mqtt"
  })
);
