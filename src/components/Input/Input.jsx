import React, { Component } from 'react'
import { View } from 'react-native'
import { IconToggle } from 'react-native-material-ui'
import { TextField } from '@ubaids/react-native-material-textfield'
import { valid } from '../../shared/utility'
import { flex } from '../../shared/styles'
import styles from './Input.styles'

import { connect } from 'react-redux'

class Input extends Component {
	state = {
		control: {},
	}

	componentDidMount() {
		const { elementConfig, value } = this.props
		this.setState({ control: elementConfig }, () => {
			this.checkValid(value, true)
		})
	}

	componentDidUpdate(prevProps) {
		if (prevProps.value !== this.props.value && this.props.value === null) {
			this.checkValid(null)
		}
	}

	checkValid = (value = this.props.value, initial = false) => {
		const { control } = this.state
		const { changed } = this.props

		if (initial && control.required && (value === '' || value === null || value === undefined)) {
			// Initial valid without label
			control.error = true
			changed('', control)
			this.textField.setValue('')
			this.setState({ control })
		} else {
			const { translations } = this.props
			valid(control, value, translations, (newControl) => {
				changed(value, newControl)
				this.textField.setValue(value)
				this.setState({ control: newControl })
			})
		}
	}

	render() {
		const { control } = this.state
		const { style, theme, focus, value, hideClearIcon } = this.props

		return (
			<View style={styles.container}>
				<View style={flex}>
					<TextField
						{...control}
						ref={(e) => {
							this.textField = e
						}}
						style={{ marginRight: 25, ...style }}
						textColor={theme.thirdTextColor}
						baseColor={theme.thirdTextColor}
						tintColor={theme.primaryColor}
						errorColor={control.error === true ? theme.thirdTextColor : theme.warningColor}
						autoFocus={focus || false}
						onChangeText={(val) => this.checkValid(val)}
						value={value}
					/>
				</View>
				{!hideClearIcon && value !== '' && (
					<View style={styles.clearIconWrapper}>
						<IconToggle onPress={() => this.checkValid('')} name='clear' size={18} />
					</View>
				)}
			</View>
		)
	}
}

const mapStateToProps = (state) => ({
	theme: state.theme.theme,
	translations: {
		...state.settings.translations.validation,
	},
})

export default connect(mapStateToProps)(Input)
