import { App } from "./app";
import { render } from "./jsx/jsx-runtime";

const rootElement = document.getElementById("app") as HTMLElement;
render(App(), rootElement);
