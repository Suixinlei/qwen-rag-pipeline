import { createWorker } from "../../utils/dashscope-agent";

const APP_ID = '2f2f0b3085bd4545a4dd546c9074c857';

export const onRequest = createWorker(APP_ID);