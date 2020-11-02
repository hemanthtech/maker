import { openDatabase } from 'expo-sqlite'
import * as actionTypes from './actionTypes'

const db = openDatabase('maker.db')

export const onUpdateProfile = (profile) => ({
	type: actionTypes.UPDATE_PROFILE,
	profile,
})

export const initProfile = (callback = () => null) => (dispatch) => {
	db.transaction(
		(tx) => {
			tx.executeSql('select * from profile;', [], (_, { rows }) => {
				dispatch(onUpdateProfile(rows._array[0]), callback())
			})
		},
		// eslint-disable-next-line no-console
		(err) => console.log(err),
	)
}

export const changeName = (name) => (dispatch) => {
	db.transaction(
		(tx) => {
			tx.executeSql('update profile set name = ? where id = 0;', [name], () => {
				dispatch(initProfile())
			})
		},
		// eslint-disable-next-line no-console
		(err) => console.log(err),
	)
}

export const changeAvatar = (avatar, callback = () => null) => (dispatch) => {
	db.transaction(
		(tx) => {
			tx.executeSql('update profile set avatar = ? where id = 0;', [avatar], () => {
				callback()
				dispatch(initProfile())
			})
		},
		// eslint-disable-next-line no-console
		(err) => console.log(err),
	)
}

export const addEndedTask = () => (dispatch, getState) => {
	const value = getState().profile.endedTask + 1
	db.transaction(
		(tx) => {
			tx.executeSql('update profile set endedTask = ? where id = 0;', [value], () => {
				dispatch(initProfile())
			})
		},
		// eslint-disable-next-line no-console
		(err) => console.log(err),
	)
}
