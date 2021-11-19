import { IUser } from '../../../../definition/IUser';
import { MatrixBridgedUser, Users } from '../../../models';

export const createUser = async (matrixUserId: string, displayName: string): Promise<IUser> => {
	// Check if a user with the same username exists
	let userId = Users.findOne({ username: matrixUserId }, { fields: { _id: 1 } });

	if (!userId) {
		userId = Users.create({
			username: matrixUserId,
			type: 'user',
			status: 'online',
			active: true,
			roles: ['user'],
			name: displayName,
			requirePasswordChange: false,
		});
	}

	// Add the user to the bridge
	try {
		MatrixBridgedUser.insert({ uid: userId, mui: matrixUserId });
	} catch (err) {
		// TODO: handle this
	}

	return Users.findOneById(userId);
};
