import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    Dimensions,
    TextInput,
    Platform,
    TouchableOpacity,
    View,
    Modal,
    FlatList,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Linking,
    UIManager,
    Animated,
    Easing,
    KeyboardAvoidingView
} from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { auth, db } from '../firebaseConfig';

// Ativar LayoutAnimation no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const THEME = {
    textPrimary: '#111111',
    textSecondary: '#555555',
    brandGreen: '#44BC7F',
    brandRed: '#FF6969',
    brandOrange: '#FA8671',
    lightGray: '#F0F0F0',
    white: '#FFFFFF',
    darkBlue: '#120D37',
    darkerBlue: '#1B0C45',
    mainTabInactiveBg: 'rgba(189, 188, 197, 0.24)',
    mainTabInactiveText: '#9E9E9E',
    secondaryTabInactiveText: '#1B0C45',
    filterInactiveBg: 'rgba(189, 188, 197, 0.24)',
    filterInactiveText: '#8C8994',
    karuTitle: '#1B0C45',
    karuSubtitle: '#6A6591',
    karuText: '#1B0C45',
    articleTitle: '#1B0C45',
    articleSubtitle: '#6A6591',
    contentBackground: '#EDEDED',
};

const { width } = Dimensions.get('window');

// --- INTERFACES ---
interface Post {
    id: string;
    text: string;
    authorName: string;
    authorId: string;
    createdAt: firebase.firestore.Timestamp | null;
    likes: string[];
    commentCount: number;
}

interface Comment {
    id: string;
    text: string;
    authorName: string;
    authorId: string;
    createdAt: firebase.firestore.Timestamp | null;
}

interface UserProfile {
    nome: string;
}

// Interface unificada para Artigos e Notícias
interface ContentItem {
    id: string;
    titulo: string;
    autor?: string; // Opcional para científicos
    imagem?: string; // Opcional (Notícias tem, Científico não)
    url: string;
    type: 'news' | 'scientific';
    createdAt?: firebase.firestore.Timestamp | null; // Para ordenação
}

// --- DADOS MOCKADOS PARA INICIALIZAÇÃO (Caso o Firestore esteja vazio) ---
// Em produção, estes dados viriam das coleções 'news' e 'scientific_articles'
const MOCK_NEWS: ContentItem[] = [
    { id: 'n1', type: 'news', titulo: 'Nova pesquisa revela benefícios da dieta mediterrânea', imagem: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', url: 'https://google.com', createdAt: firebase.firestore.Timestamp.now() },
    { id: 'n2', type: 'news', titulo: 'Alimentos ultraprocessados ligados a riscos de saúde', imagem: 'https://images.pexels.com/photos/3768894/pexels-photo-3768894.jpeg', url: 'https://google.com', createdAt: firebase.firestore.Timestamp.now() },
    { id: 'n3', type: 'news', titulo: 'A importância da hidratação na atividade física', imagem: 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg', url: 'https://google.com', createdAt: firebase.firestore.Timestamp.now() },
    { id: 'n4', type: 'news', titulo: 'Vitaminas essenciais para o inverno', imagem: 'https://images.pexels.com/photos/1396556/pexels-photo-1396556.jpeg', url: 'https://google.com', createdAt: firebase.firestore.Timestamp.now() },
    { id: 'n5', type: 'news', titulo: 'Receitas rápidas e saudáveis para o jantar', imagem: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg', url: 'https://google.com', createdAt: firebase.firestore.Timestamp.now() },
];

const MOCK_SCIENTIFIC: ContentItem[] = [
    { id: 's1', type: 'scientific', titulo: 'Efeitos da suplementação de whey protein em idosos (USP)', url: 'https://usp.br', createdAt: firebase.firestore.Timestamp.now() },
    { id: 's2', type: 'scientific', titulo: 'Análise nutricional de dietas veganas (Scielo)', url: 'https://scielo.br', createdAt: firebase.firestore.Timestamp.now() },
    { id: 's3', type: 'scientific', titulo: 'Impacto do jejum intermitente no metabolismo (Google Scholar)', url: 'https://scholar.google.com', createdAt: firebase.firestore.Timestamp.now() },
    { id: 's4', type: 'scientific', titulo: 'Microbiota intestinal e obesidade: uma revisão', url: 'https://scielo.br', createdAt: firebase.firestore.Timestamp.now() },
];

const TABS = ['Seus amigos', 'Minhas postagens', 'Artigos'];
const FILTROS_ARTIGOS = ['Todos', 'Favoritos'];

// --- FUNÇÕES AUXILIARES ---
const getInitials = (name: string) => {
    if (!name) return '...';
    const names = name.split(' ');
    const firstInitial = names[0] ? names[0][0] : '';
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';
    return (firstInitial + lastInitial).toUpperCase();
};

const formatTimeAgo = (timestamp: firebase.firestore.Timestamp | null): string => {
    if (!timestamp) return 'agora';
    const now = new Date();
    const postDate = timestamp.toDate();
    const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (seconds < 60) return 'agora';
    let interval = seconds / 60;
    if (interval < 60) return Math.floor(interval) + "m";
    interval = seconds / 3600;
    if (interval < 24) return Math.floor(interval) + "h";
    interval = seconds / 86400;
    if (interval < 7) return Math.floor(interval) + "d";
    return Math.floor(interval / 7) + "sem";
};

// --- COMPONENTES ---

// Card de Postagem (Reutilizável para feeds)
const PostCard = ({
    post,
    user,
    onEdit,
    onCommentPress
}: {
    post: Post,
    user: firebase.User | null,
    onEdit?: (post: Post) => void,
    onCommentPress: (post: Post) => void
}) => {
    const isAuthor = user ? post.authorId === user.uid : false;
    const isLiked = user ? post.likes.includes(user.uid) : false;

    const handleLike = async () => {
        if (!user) return;
        // REFERÊNCIA ATUALIZADA PARA COLEÇÃO RAIZ 'posts'
        const postRef = db.collection('posts').doc(post.id);
        try {
            if (isLiked) {
                await postRef.update({ likes: firebase.firestore.FieldValue.arrayRemove(user.uid) });
            } else {
                await postRef.update({ likes: firebase.firestore.FieldValue.arrayUnion(user.uid) });
            }
        } catch (error) {
            console.error("Erro ao curtir: ", error);
        }
    };

    return (
        <View style={styles.postCard}>
            <View style={styles.postHeader}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{getInitials(post.authorName)}</Text>
                </View>
                <View style={styles.postAuthorContainer}>
                    <Text style={styles.postAuthor}>{post.authorName}</Text>
                    <Text style={styles.postTimestamp}>{formatTimeAgo(post.createdAt)}</Text>
                </View>
                {isAuthor && onEdit && (
                    <TouchableOpacity style={styles.editButton} onPress={() => onEdit(post)}>
                        <MaterialIcons name="edit" size={20} color={THEME.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.postText}>{post.text}</Text>
            <View style={styles.postFooter}>
                <TouchableOpacity style={styles.postInteractionButton} onPress={handleLike}>
                    <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? THEME.brandRed : THEME.karuText} />
                    <Text style={styles.postInteractionText}>{post.likes.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postInteractionButton} onPress={() => onCommentPress(post)}>
                    <Ionicons name="chatbubble-outline" size={22} color={THEME.karuText} />
                    <Text style={styles.postInteractionText}>{post.commentCount}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Card de Artigo/Notícia (Adaptável)
const ContentCard = ({
    item,
    isFavorite,
    onToggleFavorite
}: {
    item: ContentItem,
    isFavorite: boolean,
    onToggleFavorite: (item: ContentItem) => void
}) => (
    <View style={styles.articleCard}>
        <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => Linking.openURL(item.url)}>
            {/* Exibe imagem apenas se for notícia (tiver imagem) */}
            {item.type === 'news' && item.imagem && (
                <Image source={{ uri: item.imagem }} style={styles.articleImage} />
            )}
            <View style={styles.articleTextContainer}>
                <Text style={styles.articleTitle} numberOfLines={3}>{item.titulo}</Text>
                {item.autor && <Text style={styles.articleAuthor}>{item.autor}</Text>}
                {item.type === 'scientific' && (
                    <Text style={styles.scientificTag}>Artigo Científico</Text>
                )}
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton} onPress={() => onToggleFavorite(item)}>
            <Ionicons name={isFavorite ? "bookmark" : "bookmark-outline"} size={24} color={isFavorite ? THEME.brandOrange : THEME.filterInactiveText} />
        </TouchableOpacity>
    </View>
);

// Karu Post Card (Mantido igual)
const KaruPostCard = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const animation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
    const [contentHeight, setContentHeight] = useState(0);

    useEffect(() => {
        Animated.timing(animation, {
            toValue: isExpanded ? 1 : 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false
        }).start();
    }, [isExpanded]);

    const animatedStyle = {
        height: animation.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] }),
        opacity: animation,
        overflow: 'hidden',
    };

    return (
        <View style={styles.karuCard}>
            <TouchableOpacity style={styles.karuHeader} onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.8}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={require('@/assets/images/karuprofile.png')} style={styles.karuMascot} />
                    <View>
                        <Text style={styles.karuTitle}>Karu</Text>
                        <Text style={styles.karuSubtitle}>Perfil oficial</Text>
                    </View>
                </View>
                <MaterialIcons name={isExpanded ? "arrow-drop-up" : "arrow-drop-down"} size={30} color={THEME.textSecondary} />
            </TouchableOpacity>
            <Animated.View style={animatedStyle as any}>
                <View onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)} style={{ position: 'absolute', width: '100%' }}>
                    <Text style={styles.karuDisclaimer}>
                        Todos os conselhos divulgados aqui não devem substituir o aconselhamento médico. Em caso de dúvidas, procure um profissional.
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
};

// --- TELA PRINCIPAL ---
export default function CommunityScreen() {
    const router = useRouter();
    const [user, setUser] = useState<firebase.User | null>(auth.currentUser);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Estados de Navegação
    const [activeTab, setActiveTab] = useState(1); // Começa em "Minhas postagens" por padrão
    const [secondaryTab, setSecondaryTab] = useState<'Notícias' | 'Aprenda mais'>('Notícias');
    const secondaryTabAnim = useRef(new Animated.Value(0)).current;

    // Estados de Posts e Amigos
    const [myPosts, setMyPosts] = useState<Post[]>([]);
    const [friendPosts, setFriendPosts] = useState<Post[]>([]);
    const [followingUids, setFollowingUids] = useState<string[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [friendUidInput, setFriendUidInput] = useState('');

    // Estados de Conteúdo (Notícias/Artigos)
    const [newsList, setNewsList] = useState<ContentItem[]>([]);
    const [scientificList, setScientificList] = useState<ContentItem[]>([]);
    const [displayedContent, setDisplayedContent] = useState<ContentItem[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [articleFilter, setArticleFilter] = useState('Todos');
    const [search, setSearch] = useState('');
    const [newsLimit, setNewsLimit] = useState(3);
    const [scientificLimit, setScientificLimit] = useState(3);

    // Modais
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editText, setEditText] = useState('');
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [currentPostForComments, setCurrentPostForComments] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newCommentText, setNewCommentText] = useState('');


    // --- EFFECTS ---
    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists) setUserProfile(doc.data() as UserProfile);

                // Carregar favoritos
                const favSnapshot = await db.collection('users').doc(user.uid).collection('favorites').get();
                setFavorites(favSnapshot.docs.map(d => d.id));

                // Carregar quem estou seguindo
                const followingSnapshot = await db.collection('users').doc(user.uid).collection('following').get();
                setFollowingUids(followingSnapshot.docs.map(d => d.id));
            }
        };
        fetchProfile();
    }, [user]);

    // Carregar Posts (Meus ou Amigos)
    useEffect(() => {
        if (!user) return;
        setLoadingPosts(true);

        let query = db.collection('posts').orderBy('createdAt', 'desc');

        if (activeTab === 1) {
            // Minhas postagens
            query = query.where('authorId', '==', user.uid);
        } else if (activeTab === 0) {
            // Postagens de amigos
            if (followingUids.length === 0) {
                setFriendPosts([]);
                setLoadingPosts(false);
                return;
            }
            // Firestore 'in' limita a 10. Para produção real, precisaria de outra estratégia (ex: fan-out)
            // Por enquanto, vamos pegar os 10 primeiros amigos para demonstração se houver muitos.
            const safeFollowing = followingUids.slice(0, 10);
            query = query.where('authorId', 'in', safeFollowing);
        } else {
            setLoadingPosts(false);
            return;
        }

        const unsubscribe = query.onSnapshot(snapshot => {
            const loadedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                likes: doc.data().likes || [],
                commentCount: doc.data().commentCount || 0
            })) as Post[];

            if (activeTab === 1) setMyPosts(loadedPosts);
            else if (activeTab === 0) setFriendPosts(loadedPosts);
            setLoadingPosts(false);
        }, err => {
            console.log("Erro ao carregar posts:", err);
            setLoadingPosts(false);
        });

        return () => unsubscribe();
    }, [user, activeTab, followingUids]);

    // Carregar Notícias/Artigos (Simulação de Real-time + Paginação local)
    useEffect(() => {
        // EM PRODUÇÃO: Substituir por listeners reais nas coleções 'news' e 'scientific_articles'
        // db.collection('news').orderBy('createdAt', 'desc').onSnapshot(...)
        setNewsList(MOCK_NEWS);
        setScientificList(MOCK_SCIENTIFIC);
    }, []);

    // Filtragem e Paginação de Conteúdo
    useEffect(() => {
        let baseList = secondaryTab === 'Notícias' ? newsList : scientificList;
        let limit = secondaryTab === 'Notícias' ? newsLimit : scientificLimit;

        // 1. Filtro de Pesquisa
        if (search.trim()) {
            baseList = baseList.filter(item =>
                item.titulo.toLowerCase().includes(search.toLowerCase())
            );
        }

        // 2. Filtro de Favoritos
        if (articleFilter === 'Favoritos') {
            baseList = baseList.filter(item => favorites.includes(item.id));
        }

        // 3. "Paginação" Local (Carrega apenas os N primeiros)
        setDisplayedContent(baseList.slice(0, limit));

    }, [newsList, scientificList, secondaryTab, search, articleFilter, favorites, newsLimit, scientificLimit]);

    // Animação das Abas Secundárias
    useEffect(() => {
        Animated.timing(secondaryTabAnim, {
            toValue: secondaryTab === 'Notícias' ? 0 : 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false
        }).start();
    }, [secondaryTab]);

    // Carregar Comentários quando abrir modal
    useEffect(() => {
        if (currentPostForComments && commentModalVisible) {
            const unsubscribe = db.collection('posts').doc(currentPostForComments.id)
                .collection('comments')
                .orderBy('createdAt', 'asc')
                .onSnapshot(snapshot => {
                    setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
                });
            return () => unsubscribe();
        }
    }, [currentPostForComments, commentModalVisible]);


    // --- HANDLERS ---

    const handleFollowUser = async () => {
        if (!user || !friendUidInput.trim()) return;
        // Em um app real, verificar se o UID existe na coleção 'users' antes de seguir.
        try {
            await db.collection('users').doc(user.uid).collection('following').doc(friendUidInput.trim()).set({
                followedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            Alert.alert('Sucesso', 'Usuário seguido! Suas postagens aparecerão no feed.');
            setFriendUidInput('');
            // Atualiza a lista local para disparar o useEffect do feed
            setFollowingUids(prev => [...prev, friendUidInput.trim()]);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível seguir o usuário.');
        }
    };

    const handleCreatePost = async () => {
        if (!newPostText.trim() || !user || !userProfile) {
            Alert.alert('Atenção', 'O post não pode estar vazio.'); return;
        }
        try {
            // SALVA NA COLEÇÃO RAIZ 'posts'
            await db.collection('posts').add({
                text: newPostText,
                authorId: user.uid,
                authorName: userProfile.nome,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likes: [],
                commentCount: 0,
            });
            setNewPostText('');
            setCreateModalVisible(false);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível publicar.');
        }
    };

    const handleUpdatePost = async () => {
        if (!editingPost || !editText.trim()) return;
        try {
            await db.collection('posts').doc(editingPost.id).update({ text: editText });
            setEditModalVisible(false); setEditingPost(null); setEditText('');
        } catch (error) { Alert.alert('Erro', 'Falha ao atualizar.'); }
    };

    const handleSendComment = async () => {
        if (!newCommentText.trim() || !userProfile || !user || !currentPostForComments) return;
        try {
            const postRef = db.collection('posts').doc(currentPostForComments.id);
            await postRef.collection('comments').add({
                text: newCommentText,
                authorId: user.uid,
                authorName: userProfile.nome,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Atualiza contador
            await postRef.update({ commentCount: firebase.firestore.FieldValue.increment(1) });
            setNewCommentText('');
        } catch (error) { Alert.alert('Erro', 'Não foi possível comentar.'); }
    };

    const handleToggleFavorite = async (item: ContentItem) => {
        if (!user) return;
        const favRef = db.collection('users').doc(user.uid).collection('favorites').doc(item.id);
        if (favorites.includes(item.id)) {
            await favRef.delete();
            setFavorites(prev => prev.filter(id => id !== item.id));
        } else {
            await favRef.set({ ...item, savedAt: firebase.firestore.FieldValue.serverTimestamp() });
            setFavorites(prev => [...prev, item.id]);
        }
    };

    const handleLoadMore = () => {
        if (secondaryTab === 'Notícias') setNewsLimit(prev => prev + 3);
        else setScientificLimit(prev => prev + 3);
    };

    // --- RENDERIZADORES ---

    const renderFriendsTab = () => (
        <View style={styles.tabContainer}>
            <View style={styles.addFriendContainer}>
                <Text style={styles.addFriendLabel}>Adicionar amigo por UID:</Text>
                <View style={styles.addFriendInputContainer}>
                    <TextInput
                        style={styles.addFriendInput}
                        placeholder="Ex: H9fd8s7df8..."
                        value={friendUidInput}
                        onChangeText={setFriendUidInput}
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                    />
                    <TouchableOpacity style={styles.addFriendButton} onPress={handleFollowUser}>
                        <MaterialIcons name="person-add" size={24} color={THEME.white} />
                    </TouchableOpacity>
                </View>
                {/* Dica para testes: Mostre o próprio UID para o usuário poder compartilhar */}
                {user && <Text style={styles.myUidTip}>Seu UID: {user.uid}</Text>}
            </View>

            {loadingPosts ? <ActivityIndicator size="large" color={THEME.brandGreen} style={{ marginTop: 20 }} /> :
                friendPosts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <FontAwesome5 name="user-friends" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>
                            {followingUids.length === 0
                                ? "Você ainda não segue ninguém.\nAdicione o UID de um amigo acima!"
                                : "Seus amigos ainda não postaram nada."}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={friendPosts}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <PostCard
                                post={item}
                                user={user}
                                onCommentPress={(p) => { setCurrentPostForComments(p); setCommentModalVisible(true); }}
                            />
                        )}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                )
            }
        </View>
    );

    const renderMyPostsTab = () => (
        <View style={styles.tabContainer}>
            {loadingPosts ? <ActivityIndicator size="large" color={THEME.brandGreen} style={{ marginTop: 20 }} /> :
                myPosts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="dynamic-feed" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Você ainda não fez nenhuma postagem.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={myPosts}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <PostCard
                                post={item}
                                user={user}
                                onEdit={(p) => { setEditingPost(p); setEditText(p.text); setEditModalVisible(true); }}
                                onCommentPress={(p) => { setCurrentPostForComments(p); setCommentModalVisible(true); }}
                            />
                        )}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                )
            }
            <TouchableOpacity style={styles.fab} onPress={() => setCreateModalVisible(true)}>
                <MaterialIcons name="edit" size={20} color={THEME.white} />
                <Text style={styles.fabText}>Novo post</Text>
            </TouchableOpacity>
        </View>
    );

    const renderArticlesTab = () => {
        // Interpolações para animação das abas
        const pillTranslateX = secondaryTabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width / 2] });
        const noticiasColor = secondaryTabAnim.interpolate({ inputRange: [0, 1], outputRange: [THEME.white, THEME.secondaryTabInactiveText] });
        const aprendaColor = secondaryTabAnim.interpolate({ inputRange: [0, 1], outputRange: [THEME.secondaryTabInactiveText, THEME.white] });

        // Verifica se tem mais itens para carregar
        const fullListSize = secondaryTab === 'Notícias'
            ? (articleFilter === 'Todos' ? newsList.length : newsList.filter(i => favorites.includes(i.id)).length)
            : (articleFilter === 'Todos' ? scientificList.length : scientificList.filter(i => favorites.includes(i.id)).length);
        const hasMore = displayedContent.length < fullListSize;

        return (
            <View style={[styles.tabContainer, { backgroundColor: THEME.contentBackground }]}>
                <FlatList
                    data={displayedContent}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ContentCard
                            item={item}
                            isFavorite={favorites.includes(item.id)}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    )}
                    ListHeaderComponent={
                        <>
                            <View style={styles.secondaryTabsContainer}>
                                <Animated.View style={[styles.animatedTabPill, { transform: [{ translateX: pillTranslateX }] }]} />
                                <TouchableOpacity style={styles.secondaryTabTouchable} onPress={() => setSecondaryTab('Notícias')}>
                                    <Animated.Text style={[styles.secondaryTabText, { color: noticiasColor }]}>Notícias</Animated.Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.secondaryTabTouchable} onPress={() => setSecondaryTab('Aprenda mais')}>
                                    <Animated.Text style={[styles.secondaryTabText, { color: aprendaColor }]}>Aprenda mais</Animated.Text>
                                </TouchableOpacity>
                            </View>

                            <KaruPostCard />
                            <Image
                                source={secondaryTab === 'Notícias' ? require('@/assets/images/karunews.png') : require('@/assets/images/karuexplicaai.png')}
                                style={styles.bannerImage}
                            />

                            <View style={styles.filterContainer}>
                                {FILTROS_ARTIGOS.map(filtro => (
                                    <TouchableOpacity
                                        key={filtro}
                                        style={[styles.filterButton, articleFilter === filtro ? styles.filterActive : styles.filterInactive]}
                                        onPress={() => setArticleFilter(filtro)}>
                                        <Text style={articleFilter === filtro ? styles.filterTextActive : styles.filterTextInactive}>{filtro}</Text>
                                    </TouchableOpacity>
                                ))}
                                <View style={styles.searchBar}>
                                    <Ionicons name="search" size={20} color={THEME.filterInactiveText} />
                                    <TextInput
                                        placeholder="Pesquisar..."
                                        style={styles.searchInput}
                                        value={search}
                                        onChangeText={setSearch}
                                        placeholderTextColor={THEME.filterInactiveText}
                                    />
                                </View>
                            </View>
                        </>
                    }
                    ListFooterComponent={
                        hasMore ? (
                            <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                                <Text style={styles.loadMoreText}>Ver mais</Text>
                            </TouchableOpacity>
                        ) : <View style={{ height: 40 }} />
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerCont}>
                    <Text style={styles.headerTitle}>Comunidade</Text>
                    <TouchableOpacity onPress={() => router.push('/(TelasAbas)/perfil')}>
                        <Ionicons name="settings-outline" size={28} color="#8A8A8A" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.mainTabsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mainTabsContainer}>
                    {TABS.map((tab, index) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.mainTab, activeTab === index && styles.mainTabActive]}
                            onPress={() => setActiveTab(index)}>
                            <Text style={activeTab === index ? styles.mainTabTextActive : styles.mainTabText}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={{ flex: 1 }}>
                {activeTab === 0 && renderFriendsTab()}
                {activeTab === 1 && renderMyPostsTab()}
                {activeTab === 2 && renderArticlesTab()}
            </View>

            {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
            <Modal animationType="fade" transparent visible={createModalVisible || editModalVisible} onRequestClose={() => { setCreateModalVisible(false); setEditModalVisible(false); }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{editModalVisible ? 'Editar postagem' : 'Criar postagem'}</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="O que você está pensando?"
                            multiline
                            value={editModalVisible ? editText : newPostText}
                            onChangeText={editModalVisible ? setEditText : setNewPostText}
                            textAlignVertical="top"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => { setCreateModalVisible(false); setEditModalVisible(false); }}>
                                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={editModalVisible ? handleUpdatePost : handleCreatePost}>
                                <Text style={styles.modalBtnTextConfirm}>{editModalVisible ? 'Salvar' : 'Postar'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* MODAL DE COMENTÁRIOS */}
            <Modal animationType="slide" transparent visible={commentModalVisible} onRequestClose={() => setCommentModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.commentModalContainer}>
                    <View style={styles.commentModalContent}>
                        <View style={styles.commentHeader}>
                            <Text style={styles.commentHeaderTitle}>Comentários</Text>
                            <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                                <Ionicons name="close" size={24} color={THEME.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={comments}
                            keyExtractor={item => item.id}
                            style={{ flex: 1 }}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => (
                                <View style={styles.commentItem}>
                                    <Text style={styles.commentAuthor}>{item.authorName} <Text style={styles.postTimestamp}>{formatTimeAgo(item.createdAt)}</Text></Text>
                                    <Text style={styles.commentText}>{item.text}</Text>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyText}>Seja o primeiro a comentar!</Text>}
                        />

                        <View style={styles.commentInputContainer}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Escreva um comentário..."
                                value={newCommentText}
                                onChangeText={setNewCommentText}
                            />
                            <TouchableOpacity style={styles.sendCommentButton} onPress={handleSendComment}>
                                <Ionicons name="send" size={20} color={THEME.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </SafeAreaView>
    );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.white },
    header: { paddingTop: Platform.OS === 'android' ? 50 : 30, paddingBottom: 10, paddingHorizontal: 20, backgroundColor: THEME.white },
    headerCont: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontFamily: 'Montserrat-Medium', color: THEME.darkBlue },

    // Abas Principais
    mainTabsWrapper: { paddingVertical: 10, backgroundColor: THEME.white },
    mainTabsContainer: { paddingHorizontal: 20 },
    mainTab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: THEME.mainTabInactiveBg, marginRight: 10 },
    mainTabActive: { backgroundColor: THEME.brandGreen },
    mainTabText: { color: THEME.mainTabInactiveText, fontFamily: 'Montserrat-Medium', fontSize: 15 },
    mainTabTextActive: { color: THEME.white, fontFamily: 'Montserrat-Medium', fontSize: 15 },

    tabContainer: { flex: 1, backgroundColor: THEME.contentBackground },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { color: '#999', textAlign: 'center', marginTop: 20, fontFamily: 'Poppins-Regular', fontSize: 16 },
    separator: { height: 1, backgroundColor: '#E0E0E0' },

    // Amigos
    addFriendContainer: { padding: 16, backgroundColor: THEME.white, borderBottomWidth: 1, borderBottomColor: '#eee' },
    addFriendLabel: { fontFamily: 'Poppins-Medium', color: THEME.darkBlue, marginBottom: 8 },
    addFriendInputContainer: { flexDirection: 'row' },
    addFriendInput: { flex: 1, backgroundColor: THEME.lightGray, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Poppins-Regular', marginRight: 10 },
    addFriendButton: { backgroundColor: THEME.brandGreen, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, borderRadius: 8 },
    myUidTip: { fontSize: 12, color: '#999', marginTop: 8, fontFamily: 'SpaceMono-Regular' },

    // Posts
    postCard: { backgroundColor: THEME.white, padding: 16 },
    postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: THEME.lightGray, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontFamily: 'Poppins-Medium', color: THEME.darkerBlue, fontSize: 16 },
    postAuthorContainer: { flex: 1 },
    postAuthor: { fontFamily: 'Poppins-Medium', fontSize: 16, color: THEME.darkerBlue },
    postTimestamp: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#999' },
    editButton: { padding: 8 },
    postText: { fontFamily: 'Poppins-Regular', fontSize: 15, color: THEME.textPrimary, lineHeight: 22 },
    postFooter: { flexDirection: 'row', marginTop: 16 },
    postInteractionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
    postInteractionText: { marginLeft: 6, fontFamily: 'Poppins-Medium', color: THEME.textSecondary },

    // FAB
    fab: { position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', backgroundColor: THEME.brandOrange, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, elevation: 5, alignItems: 'center' },
    fabText: { color: THEME.white, fontFamily: 'Poppins-Medium', marginLeft: 8, fontSize: 16 },

    // Artigos & Notícias
    secondaryTabsContainer: { flexDirection: 'row', backgroundColor: THEME.white, height: 50 },
    animatedTabPill: { position: 'absolute', width: '50%', height: '100%', backgroundColor: THEME.brandRed, borderTopLeftRadius: 25, borderTopRightRadius: 25 }, // Ajuste visual se necessário
    secondaryTabTouchable: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    secondaryTabText: { fontFamily: 'Poppins-Bold', fontSize: 14 },

    karuCard: { backgroundColor: THEME.white, borderRadius: 12, margin: 20, padding: 16 },
    karuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    karuMascot: { width: 40, height: 40, marginRight: 10 },
    karuTitle: { fontFamily: 'Poppins-Bold', color: THEME.karuTitle },
    karuSubtitle: { fontFamily: 'Poppins-Regular', color: THEME.karuSubtitle, fontSize: 12 },
    karuDisclaimer: { fontFamily: 'Poppins-Regular', fontSize: 12, color: THEME.karuText, marginTop: 12 },
    bannerImage: { width: width - 40, height: 150, marginHorizontal: 20, borderRadius: 12, marginBottom: 20, resizeMode: 'cover' },

    filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
    filterButton: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    filterActive: { backgroundColor: THEME.brandRed },
    filterInactive: { backgroundColor: THEME.filterInactiveBg },
    filterTextActive: { color: THEME.white, fontFamily: 'Montserrat-Medium' },
    filterTextInactive: { color: THEME.filterInactiveText, fontFamily: 'Montserrat-Medium' },
    searchBar: { flex: 1.5, flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.filterInactiveBg, borderRadius: 20, paddingHorizontal: 12 },
    searchInput: { flex: 1, marginLeft: 8, fontFamily: 'Montserrat-Medium', color: THEME.textPrimary },

    articleCard: { flexDirection: 'row', backgroundColor: THEME.white, marginHorizontal: 20, borderRadius: 12, overflow: 'hidden', padding: 12, alignItems: 'center' },
    articleImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
    articleTextContainer: { flex: 1 },
    articleTitle: { fontFamily: 'Poppins-Medium', fontSize: 14, color: THEME.articleTitle, marginBottom: 4 },
    articleAuthor: { fontFamily: 'Poppins-Regular', fontSize: 12, color: THEME.articleSubtitle },
    scientificTag: { fontFamily: 'Poppins-Medium', fontSize: 10, color: THEME.brandGreen, marginTop: 4 },
    favoriteButton: { padding: 8 },
    loadMoreButton: { alignSelf: 'center', marginTop: 10, padding: 10 },
    loadMoreText: { fontFamily: 'Poppins-Medium', color: THEME.brandRed, fontSize: 14 },

    // Modais
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: THEME.white, borderRadius: 16, padding: 20 },
    modalTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, marginBottom: 16, color: THEME.darkBlue },
    modalInput: { backgroundColor: THEME.lightGray, borderRadius: 8, padding: 12, minHeight: 100, fontFamily: 'Poppins-Regular', fontSize: 16, marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
    modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginLeft: 10 },
    modalBtnCancel: { backgroundColor: '#eee' },
    modalBtnConfirm: { backgroundColor: THEME.darkBlue },
    modalBtnTextCancel: { fontFamily: 'Poppins-Medium', color: '#666' },
    modalBtnTextConfirm: { fontFamily: 'Poppins-Medium', color: THEME.white },

    commentModalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    commentModalContent: { backgroundColor: THEME.white, height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    commentHeaderTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, color: THEME.darkBlue },
    commentItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    commentAuthor: { fontFamily: 'Poppins-SemiBold', color: THEME.darkerBlue, marginBottom: 4 },
    commentText: { fontFamily: 'Poppins-Regular', color: THEME.textPrimary },
    commentInputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
    commentInput: { flex: 1, backgroundColor: THEME.lightGray, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontFamily: 'Poppins-Regular', marginRight: 10, maxHeight: 100 },
    sendCommentButton: { backgroundColor: THEME.brandGreen, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});