import { createWorker } from "../../utils/dashscope-agent";

const APP_ID = '05882bd08778477eaca8e09c12e09835';

export const onRequest = createWorker(APP_ID);