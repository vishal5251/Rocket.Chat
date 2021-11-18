import { MatrixProfileInfo } from 'matrix-bot-sdk';

// @ts-ignore
import { MatrixBridgedUser, Users } from '../../models';
import { IUser } from '../../../definition/IUser';
import { IMatrixBridgedUser } from '../../models/server/models/MatrixBridgedUser';
import { bridge } from './bridge';
import { currentServer } from './servers';

// Register callbacks
import './callbacks';

async function upsertBridgedUser(u: IUser): Promise<void> {
	const matrixUserId = `@rc_${ u.username?.toLowerCase() }:${
		currentServer.domain
	}`;

	console.log(`Syncing ${ matrixUserId }...`);

	const intent = bridge.getIntent(matrixUserId);

	let currentProfile: MatrixProfileInfo = {};

	try {
		currentProfile = await intent.getProfileInfo(matrixUserId);
	} catch (err) {
		// no-op
	}

	const desiredDisplayName = `${ u.username } (${ u.name })`;

	if (desiredDisplayName !== currentProfile.displayname) {
		await intent.setDisplayName(desiredDisplayName);
	}

	MatrixBridgedUser.upsert({ uid: u._id }, { uid: u._id, mui: matrixUserId });
}

(async (): Promise<void> => {
	await bridge.run(currentServer.port);

	await bridge.initalise();

	// Check the users on the database and make sure they are in sync with the homeserver

	// Get the bridged users
	const bridgedUserIds = MatrixBridgedUser.find({}, { uid: true }).map(
		(v: IMatrixBridgedUser) => v.uid,
	);

	// Get users which are not within the bridged user ids, and create them
	const potentialUnsyncedUsers: IUser[] = Users.find(
		{},
		{ _id: true, name: true, username: true },
	).fetch();

	// Filter users
	const unsyncedUsers = potentialUnsyncedUsers.filter(
		(u: IUser) => !bridgedUserIds.includes(u._id),
	);

	// Create the mappings
	Promise.all(unsyncedUsers.map(upsertBridgedUser));
})();
