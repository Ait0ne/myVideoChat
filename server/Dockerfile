FROM node:12.18.3

WORKDIR /video-chat-server

COPY ./ ./

RUN npm install

ENV MONGODB_URI=mongodb+srv://aitone:rFuCuzEgDX5Ho50r@cluster0.nrwzw.mongodb.net/videochat?retryWrites=true&w=majority

ENV JWT_SECRET=94e9f2c05105f50a91b340378f4ed3aee2e59ed800b69ffa3b2e923d36d7cf513526ce3d6d3213c827e64b5bfdf44c08734a324ff0f4ed9d27972cf5963b772a
ENV REFRESH_JWT_SECRET=a59c8656e232d0140bec77444c5b2c26c0fd61675f891b5df69383e43ee2226146ea681451e0e2c8856cadb05e82945d1eb61a1a6485172c65a37cf697834703
ENV FCM_CREDENTIALS='./video-chat-app-39dba-firebase-adminsdk-h7s50-072b335339.json'
ENV VAPID_PRIVATE_KEY=eq5bmvw4HDtar3GZ9V57nEEoGrbMDDvl7x69AiUEvHQ
ENV VAPID_PUBLIC_KEY=BAJ94n392gAIZP-2qJ-kyUkCpKuCtmU_U8CkTwZoYmIbFMnDlX-hy91vXUdtex8MFD-aU7OiqTbahOCBXUwMSlw
ENV WEB_PUSH_CONTACT="mailto: bonafide112358@gmail.com"


CMD ["npm", "start"]

