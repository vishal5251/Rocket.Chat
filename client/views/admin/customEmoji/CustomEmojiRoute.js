import { Button, Icon } from '@rocket.chat/fuselage';
import React, { useCallback, useRef } from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import AddCustomEmoji from './AddCustomEmoji';
import CustomEmoji from './CustomEmoji';
import EditCustomEmojiWithData from './EditCustomEmojiWithData';

function CustomEmojiRoute() {
	const route = useRoute('emoji-custom');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const canManageEmoji = usePermission('manage-emoji');

	const t = useTranslation();
	const handleItemClick = (_id) => () => {
		route.push({
			context: 'edit',
			id: _id,
		});
	};

	const handleNewButtonClick = useCallback(() => {
		route.push({ context: 'new' });
	}, [route]);

	const handleClose = () => {
		route.push({});
	};

	const reload = useRef(() => null);

	const handleChange = useCallback(() => {
		reload.current();
	}, [reload]);

	if (!canManageEmoji) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page name='admin-emoji-custom'>
				<Page.Header title={t('Custom_Emoji')}>
					<Button small onClick={handleNewButtonClick} aria-label={t('New')}>
						<Icon name='plus' />
					</Button>
				</Page.Header>
				<Page.Content>
					<CustomEmoji reload={reload} onClick={handleItemClick} />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar flexShrink={0}>
					<VerticalBar.Header>
						{context === 'edit' && t('Custom_Emoji_Info')}
						{context === 'new' && t('Custom_Emoji_Add')}
						<VerticalBar.Close onClick={handleClose} />
					</VerticalBar.Header>
					{context === 'edit' && (
						<EditCustomEmojiWithData _id={id} close={handleClose} onChange={handleChange} />
					)}
					{context === 'new' && <AddCustomEmoji close={handleClose} onChange={handleChange} />}
				</VerticalBar>
			)}
		</Page>
	);
}

export default CustomEmojiRoute;
