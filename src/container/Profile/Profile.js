import React, {Component} from 'react';
import {
    Text,
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView, ActivityIndicator
} from 'react-native';
import Input from '../../components/UI/Input/Input';
import Template from '../Template/Template';
import {ImagePicker, Permissions, Constants} from 'expo';
import { Toolbar } from 'react-native-material-ui';

import { connect } from 'react-redux';
import * as actions from "../../store/actions";

class Profile extends Component {
    componentDidMount() {
        this.props.onInitSettings();
        this.props.onInitProfile();
    }

    getPermissionAsync = async () => {
        if (Constants.platform.ios) {
            const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!');
                return false;
            } else {
                return this.pickImage();
            }
        } else {
            return this.pickImage();
        }
    };

    pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
        });

        if (!result.cancelled) {
            this.props.onChangeAvatar(result.uri);
        }
    };

    render() {
        const {navigation, theme, tasks, finished, profile, categories} = this.props;
        let list;
        const listData = [];
        listData.push({ label: 'All task', data: tasks.length+finished.length });
        listData.push({ label: 'Finished task', data: finished.length });
        listData.push({ label: 'Ended task', data: profile.endedTask });
        listData.push({ label: 'All categories', data: categories.length });

        if (profile.id === 0) {
            list = listData.map((item, index) => (
                <View key={index}>
                    <View style={[styles.item, { backgroundColor: theme.primaryBackgroundColor }]}>
                        <Text style={{ color: theme.primaryColor, fontSize: 16 }}> {item.label} </Text>
                        <Text style={styles.rowContent}> {item.data} </Text>
                    </View>
                    <View style={styles.separator}/>
                </View>
            ));
        } else {
            list = (
                <View style={[styles.container, styles.horizontal]}>
                    <ActivityIndicator size="large" color="#0000ff"/>
                </View>
            )
        }

        return (
            <Template>
                <Toolbar
                    leftElement="arrow-back"
                    onLeftElementPress={() => {
                        navigation.goBack();
                    }}
                    centerElement='Profile'
                />
                {profile.id === 0 &&
                <View style={{
                    backgroundColor: theme.secondaryBackgroundColor,
                    paddingBottom: 10
                }}>
                    <TouchableOpacity onPress={() => this.getPermissionAsync()}>
                        <Image style={styles.image} source={
                            profile.avatar ?
                                {uri: profile.avatar} :
                                require('../../assets/profile.png'
                            )}/>
                    </TouchableOpacity>
                    <Input
                        elementConfig={{ label: '' }}
                        style={styles.name}
                        value={profile.name}
                        color={theme.primaryColor}
                        changed={(value) => {
                            if (value.trim() !== '') {
                                this.props.onChangeName(value);
                            } else {
                               // this.valid(value);
                            }
                        }}/>
                </View>
                }
                <ScrollView style={styles.list}>
                    {list}
                </ScrollView>
            </Template>
        )
    }
}

const styles = StyleSheet.create({
    list: {
        flex: 1
    },
    container: {
        flex: 1,
        alignItems: 'center'
    },
    horizontal: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 50
    },
    item: {
        paddingLeft: 10,
        paddingTop: 5,
        paddingBottom: 10
    },
    name: {
        alignSelf: 'center',
        textAlign: 'center',
        fontSize: 21
    },
    image: {
        height: 125,
        width: 125,
        borderRadius: 65,
        marginTop: 10,
        marginBottom: -20,
        alignSelf: 'center'
    },
    buttonText: {
        fontSize: 18,
        color: 'white',
        alignSelf: 'center'
    },
    rowContainer: {
        padding: 10
    },
    rowContent: {
        fontSize: 19
    },
    separator: {
        height: 1,
        marginLeft: 15,
        marginRight: 15,
        flex: 1,
        backgroundColor: '#E4E4E4'
    }
});

const mapStateToProps = state => {
    return {
        theme: state.theme.theme,
        settings: state.settings,
        tasks: state.tasks.tasks,
        finished: state.tasks.finished,
        profile: state.profile,
        categories: state.categories.categories,
    }
};
const mapDispatchToProps = dispatch => {
    return {
        onInitSettings: () => dispatch(actions.initSettings()),
        onInitProfile: () => dispatch(actions.initProfile()),
        onChangeName: (name) => dispatch(actions.changeName(name)),
        onChangeAvatar: (avatar) => dispatch(actions.changeAvatar(avatar)),
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Profile);