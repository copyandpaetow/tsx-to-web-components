// Set the attributes to allow any keys and very permissive values
export type HTMLAttributes = Record<string, JSXNode | undefined> & JSXIntermediate;

export type JSXIntermediate = {
	type?: string;
	children?: JSXIntermediate[];
	customName?: string;
} & Record<string, any>;

export type JSXCompilerResult = { children?: JSXCompilerResult[] } & Record<string, any>;
export type JSXFragmentCompilerResult = { children?: JSXCompilerResult[] } & Record<string, any>;

namespace JSX {
	export type IntrinsicElements = Record<string, HTMLAttributes>;
	export type Element = JSXIntermediate;
}

export type { JSX };

export type JSXNode =
	| JSXIntermediate
	| ((props: JSXCompilerResult) => JSXIntermediate)
	| boolean
	| number
	| bigint
	| string
	| null
	| undefined;

export const Fragment = ({ children }: JSXFragmentCompilerResult): JSXIntermediate => {
	return {
		type: "FRAGMENT",
		children,
	};
};

export const createElement = (type: JSXNode, props: JSXCompilerResult): JSXIntermediate => {
	if (typeof type === "function") {
		return {
			children: type(props),
			type: `custom-${type.name.toLowerCase()}`,
		} as JSXIntermediate;
	}

	const { children, ...remainingProps } = props;
	const updatedChildren: JSXIntermediate[] = [];

	(Array.isArray(children) ? children : [children]).forEach((child) => {
		if (child === undefined || child === null) {
			return;
		}

		switch (typeof child) {
			case "object":
				updatedChildren.push(child);
				break;

			case "string":
				updatedChildren.push(createTextElement(child));
				break;

			case "number":
			case "bigint":
				updatedChildren.push(createTextElement(String(child)));
				break;

			default:
				break;
		}
	});

	return {
		type,
		...remainingProps,
		children: updatedChildren,
	};
};

const createTextElement = (text: string): JSXIntermediate => {
	return {
		type: "TEXT_ELEMENT",
		nodeValue: text,
		children: [],
	};
};

const excludeMetaData = (elementKey: keyof JSXIntermediate) => {
	if (["children", "type"].includes(elementKey)) {
		return false;
	}
	return true;
};

export const render = (element: JSXIntermediate, container: HTMLElement) => {
	if (element.type === "FRAGMENT") {
		element.children?.forEach((child) => render(child, container));
		return;
	}

	let dom: HTMLElement | Text | null = null;

	if (element.type === "TEXT_ELEMENT") {
		dom = document.createTextNode("");
	} else if (element.type?.startsWith("custom-")) {
		if (!customElements.get(element.type)) {
			customElements.define(element.type, class CustomElement extends HTMLElement {});
		}

		const html = `
    <${element.type}>
      <template shadowrootmode="open"><div><slot></slot><div></template>
    </${element.type}>
  `;

		const fragment = new DOMParser().parseFromString(html, "text/html", {
			includeShadowRoots: true,
		});

		dom = fragment.querySelector(element.type) as HTMLElement;
	} else {
		dom = document.createElement(element.type);
	}

	if (!dom) {
		return;
	}

	Object.keys(element)
		.filter(excludeMetaData)
		.forEach((name) => {
			dom[name] = element[name];
		});

	// Render children if any
	(Array.isArray(element.children) ? element.children : [element.children])
		.filter(Boolean)
		.forEach((child) => render(child, dom));

	container.appendChild(dom);
};

export const jsx = createElement;
export const jsxs = createElement;
