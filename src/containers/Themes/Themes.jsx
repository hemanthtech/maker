import React, { PureComponent } from 'react'
import { Icon, IconToggle, Toolbar, withTheme } from 'react-native-material-ui'
import SettingsList from 'react-native-settings-list'
import { View } from 'react-native'
import { connect } from 'react-redux'
import Template from '../Template/Template'
import Spinner from '../../components/UI/Spinner/Spinner'
import { iconStyle } from '../../shared/styles'
import { BannerAd } from '../../components/Ads/BannerAd'

import * as actions from '../../store/actions'

class Themes extends PureComponent {
	state = {
		selectedTheme: null,
		loading: true,
	}

	componentDidMount() {
		const { onInitThemes } = this.props

		onInitThemes()
	}

	componentDidUpdate(prevProps) {
		if (
			this.props.themes !== prevProps.themes ||
			this.props.actualTheme.id !== prevProps.actualTheme.id
		) {
			this.initThemes()
		}
	}

	toggleSnackbar = (message, visible = true) => {
		const { onUpdateSnackbar } = this.props

		onUpdateSnackbar(visible, message)
	}

	initThemes = () => {
		const { actualTheme } = this.props

		if (actualTheme.id === false) {
			const { onInitTheme } = this.props

			onInitTheme()
		} else {
			const { themes } = this.props
			const selectedTheme = {}
			themes.map((theme) => {
				selectedTheme[theme.id] = +actualTheme.id === +theme.id
			})
			this.setState({ selectedTheme, loading: false })
		}
	}

	selectedThemeHandler = (value, id) => {
		if (value) {
			const { onSetSelectedTheme, translations } = this.props

			this.setState({ loading: true }, () => {
				const { selectedTheme } = this.state
				onSetSelectedTheme(id)

				Object.keys(selectedTheme).map((theme) => {
					selectedTheme[theme] = +theme === +id
				})

				this.setState({ selectedTheme, loading: false })
				this.toggleSnackbar(translations.snackbar)
			})
		}
	}

	render() {
		const { selectedTheme, loading } = this.state
		const { navigation, themes, actualTheme, translations } = this.props

		return (
			<Template bgColor={actualTheme.secondaryBackgroundColor}>
				<Toolbar
					leftElement='arrow-back'
					rightElement={
						<IconToggle
							name='add'
							color={actualTheme.primaryTextColor}
							onPress={() => navigation.navigate('Theme')}
						/>
					}
					onLeftElementPress={() => navigation.goBack()}
					centerElement={translations.title}
				/>

				{!loading ? (
					<SettingsList
						backgroundColor={actualTheme.secondaryBackgroundColor}
						borderColor={actualTheme.secondaryBackgroundColor}
						defaultItemSize={50}
					>
						<SettingsList.Item
							hasNavArrow={false}
							title={translations.themesList}
							titleStyle={{ color: '#009688', fontWeight: '500' }}
							itemWidth={50}
							borderHide='Both'
						/>
						<SettingsList.Item
							icon={
								<View style={iconStyle}>
									<Icon
										name='home'
										color={actualTheme.thirdTextColor}
										style={{ alignSelf: 'center' }}
									/>
								</View>
							}
							hasNavArrow={false}
							itemWidth={70}
							hasSwitch
							switchState={selectedTheme['0']}
							switchOnValueChange={(value) => this.selectedThemeHandler(value, 0)}
							titleStyle={{ color: actualTheme.thirdTextColor, fontSize: 16 }}
							title={translations.defaultTheme}
						/>
						<SettingsList.Item
							icon={
								<View style={iconStyle}>
									<Icon
										name='brightness-2'
										color={actualTheme.thirdTextColor}
										style={{ alignSelf: 'center' }}
									/>
								</View>
							}
							hasNavArrow={false}
							itemWidth={70}
							hasSwitch
							switchState={selectedTheme['1']}
							switchOnValueChange={(value) => this.selectedThemeHandler(value, 1)}
							titleStyle={{ color: actualTheme.thirdTextColor, fontSize: 16 }}
							title={translations.darkTheme}
						/>
						<SettingsList.Header headerStyle={{ marginTop: -5 }} />
						<SettingsList.Item
							hasNavArrow={false}
							title={translations.yourThemes}
							titleStyle={{ color: '#009688', fontWeight: 'bold' }}
							itemWidth={70}
							borderHide='Both'
						/>
						{themes.map((themeEl, index) => {
							if (index > 1) {
								return (
									<SettingsList.Item
										key={index}
										hasNavArrow
										onPress={() => navigation.navigate('Theme', { theme: themeEl.id })}
										itemWidth={70}
										hasSwitch
										switchState={selectedTheme[themeEl.id]}
										switchOnValueChange={(value) => this.selectedThemeHandler(value, themeEl.id)}
										titleStyle={{
											color: actualTheme.thirdTextColor,
											fontSize: 16,
										}}
										title={themeEl.name}
									/>
								)
							}
						})}
						<SettingsList.Item
							title={translations.addTheme}
							itemWidth={70}
							onPress={() => navigation.navigate('Theme')}
							titleStyle={{ color: actualTheme.thirdTextColor, fontSize: 16 }}
						/>
					</SettingsList>
				) : (
					<Spinner />
				)}
				<BannerAd />
			</Template>
		)
	}
}

const mapStateToProps = (state) => ({
	actualTheme: state.theme.theme,
	themes: state.theme.themes,
	translations: state.settings.translations.Themes,
})
const mapDispatchToProps = (dispatch) => ({
	onInitTheme: (callback) => dispatch(actions.initTheme(callback)),
	onInitThemes: () => dispatch(actions.initThemes()),
	onSetSelectedTheme: (id) => dispatch(actions.setSelectedTheme(id)),
	onUpdateSnackbar: (showSnackbar, snackbarText) =>
		dispatch(actions.updateSnackbar(showSnackbar, snackbarText)),
})

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(Themes))
