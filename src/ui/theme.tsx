import './fonts.css';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Button from 'rendition/dist_esm5/components/Button';
import { Flex } from 'rendition/dist_esm5/components/Flex';
import Heading from 'rendition/dist_esm5/components/Heading';
import BaseProvider from 'rendition/dist_esm5/components/Provider';
import { DefaultProps } from 'rendition/dist_esm5/common-types';
import { default as styled } from 'styled-components';

const theme = {
	font: 'SourceSansPro',
};

export const Provider: React.FunctionComponent<DefaultProps> = (props) => (
	<BaseProvider theme={theme} {...props} />
);

const StickyFlex = styled(Flex)`
	position: sticky;
	top: 0px;
	background-color: white;
`;

export const CloseableWindow: React.FunctionComponent<{
	title: string;
}> = (props) => (
	<Provider>
		<StickyFlex justifyContent="space-between" alignItems="center">
			<Flex />
			<Heading.h2>{props.title}</Heading.h2>
			<Button onClick={window.close}>✖</Button>
		</StickyFlex>
		{props.children}
	</Provider>
);

export function render(element: JSX.Element) {
	ReactDOM.render(
		element,
		document.body.appendChild(document.createElement('div')),
	);
}