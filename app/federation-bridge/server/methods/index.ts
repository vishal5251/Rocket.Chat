import { IUser } from '../../../../definition/IUser';
// @ts-ignore
import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '../../../models';
import { bridge } from '../bridge';

export const createUser = async (matrixUserId: string, displayName: string): Promise<IUser> => {
	const userId = Users.create({
		username: matrixUserId,
		type: 'user',
		status: 'online',
		active: true,
		roles: ['user'],
		name: displayName,
		requirePasswordChange: false,
	});

	// Add the user to the bridge
	MatrixBridgedUser.insert({ uid: userId, mui: matrixUserId });

	return Users.findOneById(userId);
};

export const inviteFederatedUser = async (roomId: string, matrixUserId: string): Promise<void> => {
	// Check if the user already exists locally
	const existingUserId = await MatrixBridgedUser.getId(matrixUserId);

	if (!existingUserId) {
		await createUser(matrixUserId, matrixUserId);
	}

	// Find the bridged room id
	const matrixRoomId = await MatrixBridgedRoom.getMatrixId(roomId);

	// Add our user
	await bridge.getIntent().invite(matrixRoomId, matrixUserId);
};
