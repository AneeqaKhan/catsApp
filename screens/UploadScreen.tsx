import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import axios from 'axios';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type UploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Upload'>;

type Props = {
  navigation: UploadScreenNavigationProp;
};

const UploadScreen: React.FC<Props> = ({ navigation }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const pickImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets?.length) {
        setImageUri(response.assets[0].uri || null);
      }
    });
  };

  const uploadImage = async () => {
    if (!imageUri) {
      setStatus('Please select an image before uploading.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'cat.jpg',
    } as any);
    formData.append('sub_id', 'my-user-id'); // Optional

    try {
      const response = await axios.post(
        'https://api.thecatapi.com/v1/images/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-api-key': 'DEMO-API-KEY',
          },
        }
      );

      handleUploadResponse(response);
    } catch (error) {
      handleUploadError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResponse = (response: any) => {
    if (response.status === 201) {
      setStatus('Image uploaded successfully!');
      navigation.navigate('Home');
    } else {
      setStatus('Unexpected response from server');
    }
  };

  const handleUploadError = (error: any) => {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 'Unknown error';
      if (error.response?.status === 400 && error.response.data === 'Classifcation failed: correct animal not found.') {
        setStatus('Upload failed: Please upload an image of a cat.');
      } else {
        setStatus(`Upload failed: ${errorMessage}`);
      }
    } else {
      setStatus('An unexpected error occurred.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Pick an image</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      <TouchableOpacity style={styles.button} onPress={uploadImage}>
        <Text style={styles.buttonText}>Upload image</Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator size="large" color="#FF6F61" style={styles.loadingIndicator} />
      )}

      <Text style={styles.status}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  button: {
    backgroundColor: '#FF6F61',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF6F61',
  },
  status: {
    marginTop: 10,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
});

export default UploadScreen;
