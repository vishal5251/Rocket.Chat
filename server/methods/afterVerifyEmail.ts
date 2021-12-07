import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models/server';
import { Roles } from '../../app/models/server/raw';
import { IUser } from '../../definition/IUser';

const rolesToChangeTo: Map<string, [string]> = new Map([
	['anonymous', ['user']],
]);

Meteor.methods({
	async afterVerifyEmail() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'afterVerifyEmail',
			});
		}

		const user = Users.findOneById(userId) as IUser;
		if (user && user.emails && Array.isArray(user.emails)) {
			const verifiedEmail = user.emails.find((email) => email.verified);

			const rolesThatNeedChanges = user.roles.filter((role) => rolesToChangeTo.has(role));


			if (verifiedEmail) {
				await Promise.all(rolesThatNeedChanges.map(async (role) => {
					const rolesToAdd = rolesToChangeTo.get(role);
					if (rolesToAdd) {
						await Roles.addUserRoles(userId, rolesToAdd);
					}
					await Roles.removeUserRoles(user._id, [role]);
				}));
			}
		}
	},
});
