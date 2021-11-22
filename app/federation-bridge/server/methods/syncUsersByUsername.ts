import { MatrixProfileInfo } from 'matrix-bot-sdk';

import { bridge } from '../bridge';
import { MatrixBridgedUser, Users } from '../../../models/server';
import { IUser } from '../../../../definition/IUser';
import { currentServer } from '../servers';
import { IMatrixBridgedUser } from '../../../models/server/models/MatrixBridgedUser';

export async function upsertBridgedUser(u: IUser): Promise<void> {
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

export const syncUsersByUsername = async (usernames: string[]): Promise<void[]> => {
	// Get the bridged users
	const bridgedUserIds = MatrixBridgedUser.find({}, { uid: true }).map(
		(v: IMatrixBridgedUser) => v.uid,
	);

	// Get users which are not within the bridged user ids, and create them
	const unsyncedUsers: IUser[] = Users.find(
		{ _id: { $nin: bridgedUserIds }, username: { $in: usernames } },
		{ _id: true, name: true, username: true },
	).fetch();

	// Create the mappings
	return Promise.all(unsyncedUsers.map(upsertBridgedUser));
};
