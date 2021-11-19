import { Match } from 'meteor/check';

import { slashCommands } from '../../utils';
import { Rooms, Users } from '../../models';
import { initRoomBridge } from '../../federation-bridge/server/methods/initRoomBridge';
import { inviteUser } from '../../federation-bridge/server/methods/inviteUser';
import { syncUsersByUsername } from '../../federation-bridge/server/methods/syncUsersByUsername';

function Bridge(initiator, stringParams, item) {
	if (initiator !== 'bridge' || !Match.test(stringParams, String)) {
		return;
	}

	const [command, ...params] = stringParams.split(' ');

	const { _id: userId, rid: roomId } = item;

	const user = Users.findOneById(userId);
	const room = Rooms.findOneById(roomId);

	switch (command) {
		case 'init':
			// Initialize the bridge
			// Example: /bridge init
			Promise.await(initRoomBridge(user, room));

			break;
		case 'sync_user':
			// Syncs a user
			// Example: /bridge sync_user anthony cecilia
			Promise.await(syncUsersByUsername(params));

			break;
		case 'invite':
			// Invite a user
			// Example: /bridge invite rc_helena:b.rc.allskar.com
			const [userId] = params;

			Promise.await(inviteUser(room._id, `@${ userId.replace('@', '') }`));

			break;
	}
}

slashCommands.add('bridge', Bridge);
