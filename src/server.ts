import { createApp } from "./app.js";
import { seed } from "./store.js";

seed();
const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => console.log(`shopflow-api listening on :${port}`));
