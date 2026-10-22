import type { Component, JSX } from 'solid-js';

const Page: Component<{ children: JSX.Element }> = (props) => (
    <main class="max-w-5xl mx-auto px-4 md:px-8 pb-[calc(env(safe-area-inset-bottom)+4rem)] animate-fade-in">
        {props.children}
    </main>
);

export default Page;
