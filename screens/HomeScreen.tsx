import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Cat = {
  id: string;
  url: string;
  score?: number[];
  isFavt?: boolean;
  favtId?: string;
};

const HomeScreen: React.FC<{ navigation: HomeScreenNavigationProp }> = ({ navigation }) => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0); // Add a page state for pagination
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false); // To track if more cats are being fetched

  useEffect(() => {
    fetchCats(); // Fetch initial cats
  }, []);

  const fetchCats = async (loadMore = false) => {
    if (loading || isFetchingMore) return; // Prevent multiple calls

    if (loadMore) {
      setIsFetchingMore(true); // Set fetching more flag
    } else {
      setLoading(true); // Show loading indicator for the first page
    }

    try {
      const response = await axios.get('https://api.thecatapi.com/v1/images/search', {
        params: {
          size: 'med',
          mime_types: 'jpg',
          format: 'json',
          has_breeds: 'true',
          order: 'RANDOM',
          page,
          limit: 25,
        },
        headers: {
          'x-api-key': 'YOUR_CAT_API_KEY',
        },
      });

      const updatedCats = response.data.map((cat: Cat) => ({
        ...cat,
        isFavt: false,
      }));

      if (loadMore) {
        setCats(prevCats => [...prevCats, ...updatedCats]); // Append new cats
      } else {
        setCats(updatedCats); // Set initial cats
      }

      setPage(prevPage => prevPage + 1); // Increment page
    } catch (error) {
      console.error('Failed to fetch cats:', error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleFavoriteToggle = async (cat: Cat) => {
    const { id, isFavt, favtId } = cat;

    try {
      if (isFavt) {
        // Remove from favorites
        const response = await axios.delete(`https://api.thecatapi.com/v1/favourites/${favtId}`, {
          headers: {
            'x-api-key': 'DEMO-API-KEY',
          },
        });
        if (response.data.message === 'SUCCESS') {
          setCats(cats.map(c =>
            c.id === id ? { ...c, isFavt: false } : c
          ));
        }
      } else {
        // Add to favorites
        const response = await axios.post(
          'https://api.thecatapi.com/v1/favourites',
          { image_id: id, sub_id: 'my-user-1234' },
          { headers: { 'x-api-key': 'DEMO-API-KEY' } }
        );
        if (response.data.message === 'SUCCESS') {
          setCats(cats.map(c =>
            c.id === id ? { ...c, isFavt: true, favtId: response.data.id } : c
          ));
        }
      }
    } catch (error) {
      console.error('Failed to update favorite status:', error);
    }
  };

  const handleVote = async (imageId: string, voteType: 'up' | 'down') => {
    const cat = cats.find(c => c.id === imageId);
    if (!cat) return;
  
    const currentScore = getScore(cat.score);
  
    // Prevent downvoting if the score is 0 or less
    if (voteType === 'down' && currentScore <= 0) {
      console.log('Score is already zero, cannot downvote further.');
      return;
    }
  
    try {
      const response = await axios.post(
        'https://api.thecatapi.com/v1/votes',
        {
          image_id: imageId,
          sub_id: 'my-user-1234',
          value: voteType === 'up' ? 1 : 0,
        },
        { headers: { 'x-api-key': 'DEMO-API-KEY' } }
      );
      if (response.data.message === 'SUCCESS') {
        setCats(cats.map(cat =>
          cat.id === imageId
            ? {
                ...cat,
                score: [...(cat.score || []), voteType === 'up' ? 1 : -1],
              }
            : cat
        ));
      }
    } catch (error) {
      console.error('Failed to handle vote:', error);
    }
  };
  

  const getScore = (scores: number[] = []): number => {
    return scores.reduce((total, score) => total + score, 0);
  };

  const renderItem = ({ item }: { item: Cat }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.url }} style={styles.catImage} />
      <View style={styles.iconsRow}>
        <TouchableOpacity onPress={() => handleFavoriteToggle(item)}>
          <Icon name={item.isFavt ? 'heart' : 'heart-outline'} size={24} color="#FF6F61" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleVote(item.id, 'up')}>
          <Icon name="thumbs-up-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleVote(item.id, 'down')}>
          <Icon name="thumbs-down-outline" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
      <Text style={styles.scoreText}>
        Score: {getScore(item.score)}
      </Text>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => navigation.navigate('Upload')}>
        <Text style={styles.uploadButtonText}>Upload a New Cat</Text>
      </TouchableOpacity>

      {loading && page === 0 ? (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#FF6F61" />
        </View>
      ) : (
        <FlatList
          data={cats}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={2}
          onEndReached={() => fetchCats(true)} // Fetch more cats when the user reaches the end
          onEndReachedThreshold={0.5} // Trigger the fetch when 50% from the bottom
          ListFooterComponent={isFetchingMore ? <ActivityIndicator size="large" color="#FF6F61" /> : null}
          ListEmptyComponent={<View><Text>No cats found</Text></View>}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flex: 1,
    margin: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  catImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
  },
  scoreText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    margin: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center'
  },
});

export default HomeScreen;
