
import { Permissions, Roles } from '../../../../app/models/server/raw';

export const createPermissions = async (): Promise<void> => {
	const livechatMonitorRole = 'livechat-monitor';
	const livechatManagerRole = 'livechat-manager';
	const adminRole = 'admin';

	const monitorRole = await Roles.findOneById(livechatMonitorRole, { fields: { _id: 1 } });
	if (!monitorRole) {
		await Roles.createOrUpdate(livechatMonitorRole);
	}

	await Promise.all([
		Permissions.create('manage-livechat-units', [adminRole, livechatManagerRole]),
		Permissions.create('manage-livechat-monitors', [adminRole, livechatManagerRole]),
		Permissions.create('manage-livechat-tags', [adminRole, livechatManagerRole]),
		Permissions.create('manage-livechat-priorities', [adminRole, livechatManagerRole]),
		Permissions.create('manage-livechat-canned-responses', [adminRole, livechatManagerRole, livechatMonitorRole]),
		// VOIP permissions
		// allows to hook on an ongoing call and listen
		Permissions.create('spy-voip-calls', [adminRole, livechatManagerRole, livechatMonitorRole]),
		// allows to perform an outgoing voip call
		Permissions.create('outbound-voip-calls', [adminRole, livechatManagerRole]),
	]);
};
