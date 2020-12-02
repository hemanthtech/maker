import React, { PureComponent } from 'react'
import { Platform } from 'react-native'
import { IconToggle, Toolbar } from 'react-native-material-ui'
import moment from 'moment'
import * as Analytics from 'expo-firebase-analytics'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as DocumentPicker from 'expo-document-picker'
import * as SQLite from 'expo-sqlite'
import { generateDialogObject } from '../../shared/utility'
import Dialog from '../../components/Dialog/Dialog'
import Spinner from '../../components/Spinner/Spinner'
import Template from '../Template/Template'
import { initApp } from '../../database/db'
import BackupList from './BackupList'

import * as actions from '../../store/actions'
import { connect } from 'react-redux'

class Backup extends PureComponent {
	state = {
		dialog: null,
		showDialog: false,
		backups: [],
		loading: true,
		selectedBackup: {},
		control: {
			label: this.props.translations.newName,
			required: true,
			characterRestriction: 40,
		},
	}

	componentDidMount() {
		this.loadBackupFiles()
	}

	loadBackupFiles = async () => {
		await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}Backup`, {
			intermediates: true,
		})
		await FileSystem.readDirectoryAsync(`${FileSystem.documentDirectory}Backup`)
			.then((backups) => {
				this.setState({ backups, loading: false })
			})
			.catch(() => {
				const { translations } = this.props
				this.toggleSnackbar(translations.loadingError)
				this.setState({ backups: [], loading: false })
			})
	}

	useBackupDB = (name) => {
		const { translations } = this.props
		FileSystem.copyAsync({
			from: `${FileSystem.documentDirectory}Backup/${name}`,
			to: `${FileSystem.documentDirectory}SQLite/maker.db`,
		})
			.then(() => {
				this.setState({ loading: true })
				initApp(() => {
					const { props } = this
					props.onInitTheme()
					props.onInitCategories()
					props.onInitProfile()
					props.onInitToDo()
					props.onInitSettings(() => {
						this.setState({ loading: false })
						this.toggleSnackbar(translations.dbReplaced)

						Analytics.logEvent('useBackupDB', {
							name: 'backupAction',
						})
					})
				}, true)
			})
			.catch(() => {
				this.toggleSnackbar(translations.dbReplacedError)
			})

		if (Platform.OS === 'ios') {
			setTimeout(() => {
				this.showDialog('restart')
			}, 1000)
		}
	}

	createBackup = (ownUri = false) => {
		const { translations, timeFormat } = this.props

		let date
		let uri = `${FileSystem.documentDirectory}SQLite/maker.db`
		if (ownUri) uri = ownUri

		if (timeFormat) date = moment(new Date()).format('_DD_MM_YYYY_HH_mm_ss')
		else date = moment(new Date()).format('_DD_MM_YYYY_hh_mm_ss')

		FileSystem.copyAsync({
			from: uri,
			to: `${FileSystem.documentDirectory}Backup/maker${date}`,
		})
			.then(() => {
				this.loadBackupFiles()
				this.toggleSnackbar(translations.backupCreated)

				Analytics.logEvent('createdBackup', {
					name: 'backupAction',
				})
			})
			.catch(() => {
				this.toggleSnackbar(translations.backupCreatedError)
			})
	}

	addBackupFromStorage = async () => {
		const backupPicker = await DocumentPicker.getDocumentAsync({
			type: 'application/sql',
			copyToCacheDirectory: false,
		})
		if (backupPicker.type === 'success') {
			FileSystem.copyAsync({
				from: backupPicker.uri,
				to: `${FileSystem.documentDirectory}SQLite/maker_test.db`,
			})
				.then(() => {
					this.checkDatabase()
				})
				.catch(() => {
					const { translations } = this.props
					this.toggleSnackbar(translations.backupCreatedError)
				})
		}
	}

	shareBackup = (name) => {
		Sharing.shareAsync(`${FileSystem.documentDirectory}Backup/${name}`, {
			dialogTitle: 'Share backup',
			mimeType: 'application/sql',
			UTI: 'public.database',
		})
	}

	removeBackup = (path) => {
		const { translations } = this.props
		FileSystem.deleteAsync(FileSystem.documentDirectory + path)
			.then(async () => {
				await this.loadBackupFiles()
				this.toggleSnackbar(translations.backupRemoved)
			})
			.catch(() => {
				this.toggleSnackbar(translations.backupRemovedError)
			})
	}

	checkDatabase = () => {
		const { translations } = this.props
		const db = SQLite.openDatabase('maker_test.db')
		db.transaction(
			(tx) => {
				tx.executeSql(
					'select version from settings',
					[],
					() => {
						this.createBackup(`${FileSystem.documentDirectory}SQLite/maker_test.db`)
					},
					() => {
						this.toggleSnackbar(translations.incorrectFile)
					},
				)
			},
			() => {
				this.toggleSnackbar(translations.incorrectFile)
			},
		)
	}

	renameBackup = (name) => {
		this.setState(
			{
				selectedBackup: {
					name,
					uri: `${FileSystem.documentDirectory}Backup/${name}`,
				},
			},
			() => this.showDialog('rename'),
		)
	}

	toggleSnackbar = (message, visible = true) => {
		const { onUpdateSnackbar } = this.props
		onUpdateSnackbar(visible, message)
	}

	showDialog = (action, name = null) => {
		const { translations } = this.props

		const cancelHandler = () => this.setState({ showDialog: false })

		let dialog
		if (action === 'showBackupAlert') {
			dialog = generateDialogObject(
				cancelHandler,
				translations.defaultTitle,
				`${translations.showBackupAlertDescription1} "${name}"?\n\n${translations.showBackupAlertDescription2}`,
				{
					[translations.yes]: () => {
						cancelHandler()
						this.useBackupDB(name)
					},
					[translations.cancel]: cancelHandler,
				},
			)
		} else if (action === 'showConfirmDelete') {
			dialog = generateDialogObject(
				cancelHandler,
				translations.defaultTitle,
				translations.showConfirmDeleteDescription,
				{
					[translations.yes]: () => {
						cancelHandler()
						this.removeBackup(`Backup/${name}`)
					},
					[translations.cancel]: cancelHandler,
				},
			)
		} else if (action === 'showSelectBackupSource') {
			dialog = generateDialogObject(
				cancelHandler,
				translations.showSelectBackupSourceTitle,
				[
					{
						name: translations.yourApp,
						value: translations.yourApp,
						onClick: () => {
							cancelHandler()
							this.createBackup()
						},
					},
					{
						name: translations.yourStorage,
						value: translations.yourStorage,
						onClick: () => {
							cancelHandler()
							this.addBackupFromStorage()
						},
					},
				],
				{
					[translations.cancel]: cancelHandler,
				},
			)
			dialog.select = true
		} else if (action === 'rename') {
			const { control, selectedBackup } = this.state

			dialog = generateDialogObject(
				cancelHandler,
				translations.newName,
				{
					elementConfig: control,
					focus: true,
					value: selectedBackup.name,
					onChange: (value, control) => {
						const { selectedBackup } = this.state
						selectedBackup.name = value
						this.setState({ selectedBackup, control }, () => this.showDialog(action))
					},
				},
				{
					[translations.save]: () => {
						const { selectedBackup, control } = this.state
						if (!control.error) {
							FileSystem.moveAsync({
								from: selectedBackup.uri,
								to: `${FileSystem.documentDirectory}Backup/${selectedBackup.name}`,
							})
								.then(() => this.loadBackupFiles())
								.catch(() => this.toggleSnackbar(translations.backupRenameError))
						}
						this.setState({ showDialog: false })
					},
					[translations.cancel]: cancelHandler,
				},
			)

			dialog.input = true
		} else if (action === 'restart') {
			dialog = generateDialogObject(
				() => null,
				translations.restartTitle,
				translations.restartDescription,
			)
		}

		this.setState({ dialog, showDialog: true })
	}

	render() {
		const { loading, dialog, showDialog, backups } = this.state
		const { navigation, theme, translations } = this.props

		return (
			<Template bgColor={theme.secondaryBackgroundColor}>
				<Toolbar
					leftElement='arrow-back'
					rightElement={
						<IconToggle
							color={theme.primaryTextColor}
							onPress={() => this.showDialog('showSelectBackupSource')}
							name='add'
						/>
					}
					onLeftElementPress={navigation.goBack}
					centerElement={translations.title}
				/>

				<Dialog {...dialog} theme={theme} showDialog={showDialog} />

				{!loading ? (
					<BackupList
						showDialog={this.showDialog}
						backups={backups}
						renameBackup={this.renameBackup}
						shareBackup={this.shareBackup}
						theme={theme}
						translations={translations}
					/>
				) : (
					<Spinner />
				)}
			</Template>
		)
	}
}

const mapStateToProps = (state) => ({
	theme: state.theme.theme,
	timeFormat: state.settings.settings.timeFormat,
	translations: {
		...state.settings.translations.Backup,
		...state.settings.translations.common,
	},
})

const mapDispatchToProps = (dispatch) => ({
	onInitToDo: () => dispatch(actions.initToDo()),
	onInitCategories: () => dispatch(actions.initCategories()),
	onInitTheme: () => dispatch(actions.initTheme()),
	onInitProfile: () => dispatch(actions.initProfile()),
	onInitSettings: (callback) => dispatch(actions.initSettings(callback)),
	onUpdateSnackbar: (showSnackbar, snackbarText) =>
		dispatch(actions.updateSnackbar(showSnackbar, snackbarText)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Backup)
