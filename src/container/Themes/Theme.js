import React, {Component} from 'react';
import {Button, IconToggle, Toolbar} from 'react-native-material-ui';
import Spinner from '../../components/UI/Spinner/Spinner';
import Template from '../Template/Template';
import SettingsList from 'react-native-settings-list';
import {ColorWheel} from 'react-native-color-wheel';
import colorsys from 'colorsys';
import {Text, TouchableOpacity, View} from "react-native";
import {generateDialogObject, checkValid, width} from "../../shared/utility";
import {BannerAd} from "../../../adsAPI";
import Modal from 'react-native-modalbox';
import styles from './Theme.styles';

import {connect} from 'react-redux';
import * as actions from "../../store/actions";

class Theme extends Component {
    state = {
        customTheme: {id: false, name: ''},
        newThemeName: '',
        defaultName: this.props.translations.defaultName,
        names: [
            'id', 'name', 'Primary color', 'Primary background color', 'Secondary background color',
            'Primary text color', 'Secondary text color', 'Third text color', 'Warning color',
            'Done icon color', 'Undo icon color', 'Low color', 'Medium color', 'High color'
        ],

        showColorPicker: false,
        colorPickerTitle: '',
        selectedColor: '',
        actualColor: '',

        control: {
            label: this.props.translations.themeNameLabel,
            required: true,
            characterRestriction: 30,
            error: true
        },
        loading: true
    };

    componentDidMount() {
        const theme = this.props.navigation.getParam('theme', false);
        this.initTheme(theme);
    }

    initTheme = (id) => {
        if (id !== false) {
            this.props.onInitCustomTheme(id, (customTheme) => {
                this.setState({customTheme, newThemeName: customTheme.name, loading: false});
            });
        } else {
            this.props.onInitTheme(customTheme => {
                customTheme.id = false;
                customTheme.name = this.props.translations.defaultName;
                this.setState({customTheme, newThemeName: customTheme.name, loading: false});
            });
        }
    };

    showDialog = (action) => {
        const {translations} = this.props;
        let dialog;
        if (action === 'exit') {
            dialog = generateDialogObject(
                translations.defaultTitle,
                translations.exitDescription,
                {
                    [translations.yes]: () => {
                        this.props.onUpdateModal(false);
                        this.props.navigation.goBack();
                    },
                    [translations.save]: () => {
                        this.props.onUpdateModal(false);
                        this.checkValid('name', true);
                    },
                    [translations.cancel]: () => this.props.onUpdateModal(false)
                }
            );
        } else if (action === 'delete') {
            dialog = generateDialogObject(
                translations.defaultTitle,
                translations.deleteDescription,
                {
                    [translations.yes]: () => {
                        this.props.onUpdateModal(false);
                        this.deleteTheme();
                        this.props.navigation.goBack();
                    },
                    [translations.no]: () => {
                        this.props.onUpdateModal(false);
                    }
                }
            );
        } else if (action === 'changeName') {
            const {newThemeName, control} = this.state;

            dialog = generateDialogObject(
                translations.changeNameTitle,
                {
                    elementConfig: control,
                    focus: true,
                    value: newThemeName,
                    onChange: (value, control) => {
                        this.setState({newThemeName: value, control}, () => {
                            this.showDialog(action);
                        })
                    }
                },
                {
                    [translations.save]: () => {
                        if (!control.error) {
                            const {customTheme, newThemeName} = this.state;
                            customTheme.name = newThemeName;
                            this.setState({customTheme});
                            this.props.onUpdateModal(false);
                        }
                    },
                    [translations.cancel]: () => {
                        const {customTheme, control} = this.state;
                        delete control.error;
                        this.setState({newThemeName: customTheme.name, control});
                        this.props.onUpdateModal(false);
                    },
                }
            );
            dialog.input = true;
        }

        this.props.onUpdateModal(true, dialog);
    };

    deleteTheme = () => {
        const {customTheme} = this.state;
        if (this.props.theme.id === customTheme.id) {
            this.props.onSetSelectedTheme(0); // Set default theme
        }
        this.props.onDeleteTheme(customTheme.id);
    };

    checkValid = (name = this.state.customTheme.name) => {
        const {defaultName, control} = this.state;
        return checkValid(control, name) && name !== defaultName;
    };

    configColorPicker = (colorPickerTitle, selectedColor) => {
        this.setState({colorPickerTitle, selectedColor, showColorPicker: true});
    };

    onSaveColor = () => {
        const {selectedColor, actualColor} = this.state;
        const customTheme = this.state.customTheme;
        customTheme[selectedColor] = colorsys.hsvToHex(actualColor);

        this.setState({customTheme, showColorPicker: false});
    };

    saveTheme = () => {
        const {customTheme} = this.state;
        const {navigation} = this.props;
        this.props.onSaveTheme(customTheme);
        navigation.goBack();
    };

    render() {
        const {
            customTheme, loading, names, showColorPicker, selectedColor,
            colorPickerTitle, actualColor
        } = this.state;
        const {navigation, theme, translations} = this.props;

        return (
            <Template bgColor={theme.secondaryBackgroundColor}>
                <Toolbar
                    leftElement="arrow-back"
                    rightElement={
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            {this.checkValid() &&
                            <IconToggle name="save"
                                        color={theme.primaryTextColor}
                                        onPress={this.saveTheme}/>
                            }
                            {customTheme.id !== false &&
                            <IconToggle name="delete"
                                        color={theme.primaryTextColor}
                                        onPress={() => this.showDialog('delete')}/>
                            }
                        </View>
                    }
                    onLeftElementPress={() => {
                        if (this.checkValid()) {
                            this.showDialog('exit');
                        } else navigation.goBack();
                    }}
                    centerElement={
                        !loading ?
                            <TouchableOpacity onPress={() => this.showDialog('changeName')}>
                                <Text style={{
                                    color: theme.primaryTextColor,
                                    fontWeight: 'bold',
                                    fontSize: 18
                                }}>
                                    {customTheme.name}
                                </Text>
                            </TouchableOpacity> :
                            <View style={{marginTop: 10, marginRight: 40}}>
                                <Spinner color={theme.secondaryBackgroundColor} size='small'/>
                            </View>
                    }
                />

                <Modal
                    isOpen={showColorPicker}
                    swipeToClose={showColorPicker}
                    onClosed={() => this.setState({showColorPicker: false})}>
                    <View style={{flex: 1, padding: 45}}>
                        <View style={{flex: 1}}>
                            <Text style={{fontSize: 21, textAlign: 'center'}}>{colorPickerTitle}</Text>
                        </View>
                        <ColorWheel
                            style={{flex: 5}}
                            initialColor={customTheme[selectedColor]}
                            onColorChangeComplete={(color) => this.setState({actualColor: color})}
                        />
                        <View style={{
                            flex: 2,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Button raised icon="done" text={translations.save}
                                    onPress={this.onSaveColor}
                                    style={{
                                        container: {backgroundColor: theme.doneIconColor},
                                        text: {color: theme.primaryTextColor}
                                    }}
                            />
                            <Button raised accent icon="clear" text={translations.cancel}
                                    onPress={() => this.setState({showColorPicker: false})}
                                    style={{
                                        container: {backgroundColor: theme.warningColor},
                                        text: {color: theme.primaryTextColor}
                                    }}
                            />
                        </View>
                    </View>
                </Modal>

                {!loading ?
                    <SettingsList backgroundColor={theme.primaryBackgroundColor}
                                  borderColor={theme.secondaryBackgroundColor}
                                  defaultItemSize={50}>
                        <SettingsList.Item
                            hasNavArrow={false}
                            title={translations.main}
                            titleStyle={{color: '#009688', fontWeight: '500'}}
                            itemWidth={50}
                            borderHide={'Both'}
                        />
                        {Object.keys(customTheme).map((key, index) => {
                            if (key === 'id' || key === 'name') return null;
                            const themeList = [];
                            if (key === 'bottomNavigationColor') {
                                themeList.push(<SettingsList.Header headerStyle={{marginTop: -5}}/>);
                                themeList.push(
                                    <SettingsList.Item
                                        hasNavArrow={false}
                                        title={translations.elements}
                                        titleStyle={styles.titleStyle}
                                        itemWidth={70}
                                        borderHide={'Both'}
                                    />
                                );
                            } else if (key === 'doneButtonColor') {
                                themeList.push(<SettingsList.Header headerStyle={{marginTop: -5}}/>);
                                themeList.push(
                                    <SettingsList.Item
                                        hasNavArrow={false}
                                        title={translations.buttons}
                                        titleStyle={styles.titleStyle}
                                        itemWidth={70}
                                        borderHide={'Both'}
                                    />
                                );
                            } else if (key === 'noneColor') {
                                themeList.push(<SettingsList.Header headerStyle={{marginTop: -5}}/>);
                                themeList.push(
                                    <SettingsList.Item
                                        hasNavArrow={false}
                                        title={translations.priorities}
                                        titleStyle={styles.titleStyle}
                                        itemWidth={70}
                                        borderHide={'Both'}
                                    />
                                );
                            }
                            themeList.push(
                                <SettingsList.Item
                                    itemWidth={70}
                                    titleStyle={{color: theme.thirdTextColor, fontSize: 16}}
                                    title={names[index]}
                                    onPress={() => this.configColorPicker(names[index], key)}
                                    arrowIcon={<View
                                        style={[
                                            styles.colorPreview,
                                            {
                                                borderColor: theme.thirdTextColor,
                                                backgroundColor: customTheme[key]
                                            }]
                                        }
                                    />}
                                />
                            );
                            return themeList;
                        })}
                    </SettingsList> : <Spinner/>
                }
                <BannerAd/>
            </Template>
        );
    }
}

const mapStateToProps = state => {
    return {
        theme: state.theme.theme,
        translations: {
            ...state.settings.translations.Theme,
            ...state.settings.translations.validation,
            ...state.settings.translations.common
        }
    }
};
const mapDispatchToProps = dispatch => {
    return {
        onInitTheme: (callback) => dispatch(actions.initTheme(callback)),
        onInitCustomTheme: (id, callback) => dispatch(actions.initCustomTheme(id, callback)),
        onSaveTheme: (theme) => dispatch(actions.saveTheme(theme)),
        onSetSelectedTheme: (id) => dispatch(actions.setSelectedTheme(id)),
        onDeleteTheme: (id) => dispatch(actions.deleteTheme(id)),
        onUpdateModal: (showModal, modal) => dispatch(actions.updateModal(showModal, modal))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Theme);