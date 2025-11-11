// app/(TelasAbas)/despensa.tsx - MERGED CODE
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; 
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { 
    Alert, 
    FlatList, 
    Image, 
    Platform, 
    Dimensions, 
    SafeAreaView, 
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    ActivityIndicator, 
    ListRenderItemInfo,
    KeyboardAvoidingView, // Adicionado
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Bell } from 'lucide-react-native'; // Removido (não usado)
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db, auth } from '@/app/firebaseConfig'; 

const { width } = Dimensions.get('window');

const THEME = {
    // Fundo da tela inteira (cinza claro)
    background: '#EDEDED', 
    // Fundo dos cards e header
    card: '#FFFFFF', 
    // Títulos principais
    textPrimary: '#1B0C45', 
    // Subtítulos e texto secundário
    textSecondary: '#6A6591', 
    textMicroValue: '#8C8994', 
    red: '#FF3737', 
    // Cor verde principal
    green: '#44BC7F', 
    caloryText: '#FF3737', 
    caloryBg: '#FF373747', 
    proteinText: '#A8BA31', 
    proteinBg: '#A8BA315C', 
    carbText: '#D377E5', 
    carbBg: '#D377E594', 
    fatText: '#F3870D', 
    fatBg: '#F3870D3B', 
    tagBackground: '#E5E7EB', 
    white: '#FFFFFF',
    // Cor de fundo das abas inativas
    abaInativaBg: 'rgba(189, 188, 197, 0.24)',
};


type Produto = {
    id: string;
    code: string;
    nome?: string;
    quantidade: number;
    imagem?: string;
    nutriments?: any;
    ecoscore_grade?: string;
    serving_size?: string;
    expiration_date?: string;
};
type ItemListaCompras = { id: string; nome: string; comprado: boolean; };
type AdicionarItem = { id: 'adicionar'; type: 'adicionar' };
type ProdutoItem = Produto & { type: 'produto' };
type GridItemType = AdicionarItem | ProdutoItem;


export default function DespensaScreen(): React.JSX.Element {
    // --- ESTADOS E HOOKS DO LOGIC CODE ---
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loadingProdutos, setLoadingProdutos] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const params = useLocalSearchParams<{ novoProduto?: string }>();
    const lastAddedBarcodeRef = useRef<string | null>(null);
    
    // --- ESTADOS DA LISTA DE COMPRAS ---
    const [abaAtiva, setAbaAtiva] = useState<'itens' | 'lista'>('itens');
    const [listaDeCompras, setListaDeCompras] = useState<ItemListaCompras[]>([]);
    const [novoItem, setNovoItem] = useState('');
    
    // --- NOVOS ESTADOS PARA EDIÇÃO INLINE ---
    const [isAddingItem, setIsAddingItem] = useState(false); // Controla se o campo de input está visível
    const [tituloLista, setTituloLista] = useState('Lista de compras'); // Re-adicionado
    const [editandoTitulo, setEditandoTitulo] = useState(false); // Re-adicionado
    
    const [loadingLista, setLoadingLista] = useState(true); 
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const flatListRef = useRef<FlatList<ItemListaCompras>>(null); // Ref para a FlatList

    // --- LÓGICA DE useEffects (Produtos) ---
    useEffect(() => {
      setLoadingProdutos(true); 
      const unsubscribe = auth.onAuthStateChanged(user => {
          if (user) {
              setUserId(user.uid);
          } else {
              setUserId(null);
              setProdutos([]);
              setLoadingProdutos(false); 
              setListaDeCompras([]); 
              setLoadingLista(false); 
          }
      });
      return unsubscribe;
    }, []);

    useEffect(() => {
        if (!userId) {
            setLoadingProdutos(false);
            setProdutos([]);
            return;
        }

        setLoadingProdutos(true); 
        const userProductsRef = db.collection('users').doc(userId).collection('products');

        const unsubscribe = userProductsRef
            .orderBy('nome')
            .onSnapshot(snapshot => {
                const produtosFirestore: Produto[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    produtosFirestore.push({
                        id: doc.id, code: data.code, nome: data.nome, quantidade: data.quantidade,
                        imagem: data.imagem, nutriments: data.nutriments, ecoscore_grade: data.ecoscore_grade,
                        serving_size: data.serving_size, expiration_date: data.expiration_date
                    });
                });
                setProdutos(produtosFirestore);
                setLoadingProdutos(false); 
            }, (error) => {
                console.error("Erro no listener do Firestore (Produtos):", error);
                setLoadingProdutos(false); 
                Alert.alert("Erro", "Não foi possível carregar seus produtos.");
            });

        return () => unsubscribe();
    }, [userId]);

    // --- LÓGICA DE useEffects (Lista de Compras) ---
    useEffect(() => {
        if (!userId) {
            setLoadingLista(false);
            setListaDeCompras([]);
            return;
        }
        
        if (abaAtiva === 'lista') {
            setLoadingLista(true);
            const listaRef = db.collection('users').doc(userId).collection('shopping_list');
            
            const unsubscribe = listaRef
                .orderBy('createdAt', 'asc') 
                .onSnapshot(snapshot => {
                    const itensFirestore: ItemListaCompras[] = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        itensFirestore.push({
                            id: doc.id,
                            nome: data.nome,
                            comprado: data.comprado,
                        });
                    });
                    setListaDeCompras(itensFirestore);
                    setLoadingLista(false);
                }, (error) => {
                    console.error("Erro no listener do Firestore (Lista):", error);
                    setLoadingLista(false);
                    Alert.alert("Erro", "Não foi possível carregar a lista de compras.");
                });
            
            return () => unsubscribe();
        }
    }, [userId, abaAtiva]); 

    // --- useEffect para scanner (Mantido) ---
    useEffect(() => {
      const paramProduto = params.novoProduto;
      if (!paramProduto || !userId) return;

      let novoProdutoParams: { id: string; code: string; nome?: string; imagem?: string; quantidade: number };
      try {
          novoProdutoParams = JSON.parse(paramProduto as string);
          if (novoProdutoParams.code === lastAddedBarcodeRef.current) return;
      } catch (error) { console.error("Erro ao processar JSON do novo produto:", error); return; }

      lastAddedBarcodeRef.current = novoProdutoParams.code;
      const productCode = novoProdutoParams.code;
      const productRef = db.collection('users').doc(userId).collection('products').doc(productCode);
      const quantidadeInicial = Math.max(1, novoProdutoParams.quantidade || 1);

      db.runTransaction(async (transaction) => {
          const doc = await transaction.get(productRef);
          const dataToSave: Partial<Produto> & { lastUpdatedAt?: firebase.firestore.FieldValue, createdAt?: firebase.firestore.FieldValue } = {
              code: productCode, nome: novoProdutoParams.nome || 'Nome Indisponível',
              imagem: novoProdutoParams.imagem || 'https://via.placeholder.com/100',
              lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          if (!doc.exists) {
              transaction.set(productRef, { ...dataToSave, quantidade: quantidadeInicial, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
          } else {
              transaction.update(productRef, { ...dataToSave, quantidade: firebase.firestore.FieldValue.increment(quantidadeInicial) });
          }
      }).then(() => {
            router.setParams({ novoProduto: undefined }); 
            lastAddedBarcodeRef.current = null;
      }).catch((error) => {
        console.error(`Erro na transação para ${productCode}:`, error);
        Alert.alert("Erro", "Não foi possível salvar o produto na despensa.");
            router.setParams({ novoProduto: undefined }); 
        lastAddedBarcodeRef.current = null;
      });

    }, [params.novoProduto, userId, router]);

    // --- NOVO: useEffect para rolar a lista ---
    useEffect(() => {
        if (isAddingItem) {
            // Dá um pequeno tempo para o TextInput renderizar antes de rolar
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [isAddingItem]);


    // --- FUNÇÕES DE MANIPULAÇÃO DA LISTA (ATUALIZADAS) ---
    
    // Adiciona item no Firebase (agora recebe o nome)
    const adicionarItemLista = async (nome: string) => {
        if (!userId) return;
        try {
            await db.collection('users').doc(userId).collection('shopping_list').add({
                nome: nome,
                comprado: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } catch (error) {
            console.error("Erro ao adicionar item: ", error);
            Alert.alert("Erro", "Não foi possível adicionar o item.");
        }
    };

    // Chamado ao Sair (onBlur) ou Submeter (onSubmitEditing) o TextInput inline
    const handleAddItem = () => {
        const trimmedItem = novoItem.trim();
        if (trimmedItem.length > 0) {
            adicionarItemLista(trimmedItem); 
        }
        setNovoItem('');
        setIsAddingItem(false); // Esconde o campo de input
    };

    // Marca item no Firebase
    const marcarItem = async (id: string, compradoAtual: boolean) => {
        if (!userId) return;
        try {
            await db.collection('users').doc(userId).collection('shopping_list').doc(id).update({
                comprado: !compradoAtual,
            });
        } catch (error) {
            console.error("Erro ao marcar item: ", error);
            Alert.alert("Erro", "Não foi possível atualizar o item.");
        }
    };
    
    // Remove item no Firebase
    const removerItem = async (id: string) => {
        if (!userId) return;
        try {
            await db.collection('users').doc(userId).collection('shopping_list').doc(id).delete();
        } catch (error) {
            console.error("Erro ao remover item: ", error);
            Alert.alert("Erro", "Não foi possível remover o item.");
        }
    };

    // Pergunta antes de remover
    const handleLongPressItem = (item: ItemListaCompras) => {
        Alert.alert(
            "Remover Item",
            `Tem certeza que deseja remover "${item.nome}" da lista?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Remover", onPress: () => removerItem(item.id), style: "destructive" }
            ]
        );
    };

    // NOVO: Função para apagar a lista inteira
    const handleClearList = async () => {
        if (!userId || listaDeCompras.length === 0) return;

        Alert.alert(
            "Apagar Lista",
            "Tem certeza que deseja apagar a lista de compras inteira? Esta ação não pode ser revertida.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Apagar", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            setLoadingLista(true); // Mostra loading
                            const listRef = db.collection('users').doc(userId).collection('shopping_list');
                            const snapshot = await listRef.get();
                            
                            if (snapshot.empty) {
                                setLoadingLista(false);
                                return;
                            }

                            const batch = db.batch();
                            snapshot.docs.forEach(doc => {
                                batch.delete(doc.ref);
                            });
                            await batch.commit();
                            // O listener onSnapshot vai atualizar a lista para vazia e parar o loading
                        } catch (error) {
                            console.error("Erro ao apagar lista: ", error);
                            Alert.alert("Erro", "Não foi possível apagar a lista.");
                            setLoadingLista(false);
                        }
                    }
                }
            ]
        );
    };


    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const renderCardItem = ({ item }: { item: ProdutoItem }): React.JSX.Element => { 
        return (
            <TouchableOpacity style={styles.card} onPress={() => { router.push({ pathname: '/TelasVariadas/produto', params: { produto: JSON.stringify(item) }, }); }} activeOpacity={0.8} >
                <Image source={{ uri: item.imagem || 'https://via.placeholder.com/100' }} style={styles.produtoImagem} />
                <Text style={styles.cardQuantidade} numberOfLines={1}> {item.quantidade} restante{item.quantidade > 1 ? 's' : ''} </Text>
            </TouchableOpacity>
        );
    };

    const renderGridItem = ({ item }: ListRenderItemInfo<GridItemType>): React.JSX.Element => {
        if (item.type === 'adicionar') {
            return (
                <TouchableOpacity style={styles.cardAdicionar} onPress={() => router.push('/TelasVariadas/leitor')} activeOpacity={0.8} >
                    <Ionicons name="barcode-outline" size={60} color="#349E65" />
                    <Text style={styles.adicionarTexto}>Adicionar{'\n'}novo produto</Text>
                </TouchableOpacity>
            );
        } else {
            return renderCardItem({ item: item as ProdutoItem });
        }
    };

    // RENDERIZAÇÃO DA LISTA DE COMPRAS
    const renderItemLista = ({ item }: ListRenderItemInfo<ItemListaCompras>) => (
        <TouchableOpacity 
            style={styles.listaItem} 
            onPress={() => marcarItem(item.id, item.comprado)}
            onLongPress={() => handleLongPressItem(item)} // Adicionado LongPress
            activeOpacity={0.7}
        >
            <MaterialIcons 
                name={item.comprado ? 'check-box' : 'check-box-outline-blank'} 
                size={28} 
                color={item.comprado ? THEME.green : '#BDBDBD'} 
            />
            <Text style={[styles.listaItemTexto, item.comprado && styles.listaItemTextoComprado]}>
                {item.nome}
            </Text>
        </TouchableOpacity>
    );

    // DADOS PARA A FLATLIST "MEUS ITENS"
    const dadosFlatList: GridItemType[] = [
        { id: 'adicionar', type: 'adicionar' },
        ...produtos.map((p): ProdutoItem => ({ ...p, type: 'produto' })), 
    ];


    // --- ESTRUTURA JSX (ATUALIZADA) ---
    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
            <View style={styles.header}>
                <View style={styles.headerCont}>
                    <Text style={styles.headerTitle}>Minha despensa</Text>
                        <TouchableOpacity onPress={() => router.push('/(TelasAbas)/perfil')}>
                            <Ionicons name="settings-outline" size={26} color={THEME.textPrimary} />
                        </TouchableOpacity>
                </View>
                <View style={styles.abasContainer}>
                    <TouchableOpacity 
                        style={[
                            styles.abaBase, 
                            abaAtiva === 'itens' ? styles.abaAtiva : styles.abaInativa
                        ]} 
                        onPress={() => setAbaAtiva('itens')}
                    >
                        <Text style={[
                            styles.abaTexto, 
                            abaAtiva === 'itens' ? styles.abaTextoAtivo : styles.abaTextoInativo
                        ]}>
                            Meus itens
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[
                            styles.abaBase, 
                            abaAtiva === 'lista' ? styles.abaAtiva : styles.abaInativa
                        ]} 
                        onPress={() => setAbaAtiva('lista')}
                    >
                        <Text style={[
                            styles.abaTexto, 
                            abaAtiva === 'lista' ? styles.abaTextoAtivo : styles.abaTextoInativo
                        ]}>
                            Lista de compras
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        
            {/* ATUALIZADO: KeyboardAvoidingView envolve o conteúdo */}
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : undefined} // 'height' no Android pode bugar
                style={styles.contentContainer}
                keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 0} // Ajuste o offset conforme necessário
            >
                {abaAtiva === 'itens' ? (
                    <>
                        <Text style={styles.subtitulo}>Produtos salvos na sua despensa.</Text>

                        {loadingProdutos && (<ActivityIndicator size="large" color={THEME.green} style={{ marginTop: 50, flex: 1 }} />)}

                        {!loadingProdutos && userId && (
                            <>
                                {dadosFlatList.length <= 1 ? (
                                    <View style={styles.emptyItensContainer}>
                                        <TouchableOpacity style={styles.emptyCardAdicionar} onPress={() => router.push('/TelasVariadas/leitor')} activeOpacity={0.8}>
                                            <Ionicons name="barcode-outline" size={50} color="#349E65" />
                                            <Text style={styles.emptyAdicionarTexto}>Adicionar{'\n'}novo produto</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                     <FlatList
                                        data={dadosFlatList}
                                        numColumns={3}
                                        keyExtractor={(item) => item.id}
                                        renderItem={renderGridItem}
                                        contentContainerStyle={styles.flatListContent}
                                        showsVerticalScrollIndicator={false}
                                     />
                                )}
                            </>
                        )}
                        {!loadingProdutos && !userId && ( <View style={styles.containerVazio}><Text style={styles.textoVazio}>Faça login para ver sua despensa.</Text></View> )}
                    </>
                ) : (
                    // --- ABA LISTA DE COMPRAS (REFEITA CONFORME IMAGEM) ---
                    <View style={styles.listaContainer}>
                        {loadingLista ? (
                            <ActivityIndicator size="large" color={THEME.green} style={{ marginTop: 50 }} />
                        ) : (
                            <View style={styles.listaCard}>
                                <View style={styles.listaHeader}>
                                    {/* Título editável */}
                                    {editandoTitulo ? (
                                        <TextInput 
                                            style={[styles.listaTitulo, styles.listaTituloInput]} 
                                            value={tituloLista} 
                                            onChangeText={setTituloLista} 
                                            onBlur={() => setEditandoTitulo(false)} 
                                            onSubmitEditing={() => setEditandoTitulo(false)} 
                                            autoFocus 
                                        />
                                    ) : (
                                        <Text style={styles.listaTitulo}>{tituloLista}</Text>
                                    )}

                                    {/* Ícone de Lápis */}
                                    <TouchableOpacity 
                                        style={styles.infoIcon}
                                        onPress={() => setEditandoTitulo(true)}
                                    >
                                        <Ionicons name="pencil-outline" size={22} color={THEME.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                                
                                <FlatList
                                    ref={flatListRef} // Adiciona a ref
                                    data={listaDeCompras}
                                    keyExtractor={item => item.id}
                                    renderItem={renderItemLista}
                                    showsVerticalScrollIndicator={false}
                                    ListEmptyComponent={
                                        <Text style={styles.listaVaziaTexto}>Sua lista está vazia.</Text>
                                    }
                                    // Footer "Adicionar Item" ou Input
                                    ListFooterComponent={
                                        <>
                                            {/* Input inline */}
                                            {isAddingItem ? (
                                                <View style={styles.listaItem}>
                                                    <MaterialIcons name={'check-box-outline-blank'} size={28} color={'#BDBDBD'}/>
                                                    <TextInput
                                                        style={styles.listaItemInput}
                                                        placeholder="Novo item..."
                                                        placeholderTextColor="#BDBDBD"
                                                        value={novoItem}
                                                        onChangeText={setNovoItem}
                                                        autoFocus={true}
                                                        onBlur={handleAddItem} // <-- ÚNICA CHAMADA (CORRIGIDO)
                                                        // onSubmitEditing={handleAddItem} // <-- REMOVIDO
                                                        returnKeyType="done"
                                                    />
                                                </View>
                                            ) : (
                                                <TouchableOpacity 
                                                    style={styles.adicionarItemButton} 
                                                    onPress={() => setIsAddingItem(true)} // Apenas mostra o input
                                                >
                                                    <Ionicons name="add-circle" size={24} color={THEME.textPrimary} />
                                                    <Text style={styles.adicionarItemTexto}>Adicionar item</Text>
                                                </TouchableOpacity>
                                            )}
                                            
                                            {/* Footer com Dica e Lixeira */}
                                            <View style={styles.listaFooterContainer}>
                                                <Text style={styles.dicaRemoverTexto}>
                                                    Segure um item para removê-lo
                                                </Text>
                                                <TouchableOpacity 
                                                    onPress={handleClearList} 
                                                    disabled={listaDeCompras.length === 0}
                                                >
                                                    <Ionicons 
                                                        name="trash-outline" 
                                                        size={24} 
                                                        color={listaDeCompras.length === 0 ? '#D3D3D3' : THEME.red} 
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        </>
                                    }
                                />
                            </View>
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}


const CARD_WIDTH = 110;
const CARD_HEIGHT = 130;

// --- ESTILOS ATUALIZADOS ---
const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: THEME.background // Fundo da tela inteira
    },

    header: {
        paddingTop: Platform.OS === 'android' ? 50 : 30, 
        paddingBottom: 20, 
        backgroundColor: THEME.card, 
        paddingHorizontal: 20,
    },
    headerCont: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20, 
    },
    headerTitle: {
        fontSize: 28, 
        fontFamily: 'Poppins-Bold', 
        color: THEME.textPrimary,
    },
    abasContainer: { 
        flexDirection: 'row', 
        gap: 10, 
        width: '100%', 
    },
    abaBase: { 
        flex: 1, 
        paddingVertical: 12, 
        paddingHorizontal: 16, 
        borderRadius: 25, 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    abaAtiva: { 
        backgroundColor: THEME.green, 
        borderColor: THEME.green,
    },
    abaInativa: { 
        backgroundColor: THEME.abaInativaBg, 
        borderColor: THEME.abaInativaBg,
    },
    abaTexto: { 
        fontFamily: 'Poppins-Medium', 
        fontSize: 15, 
    },
    abaTextoAtivo: {
        color: THEME.white, 
    },
    abaTextoInativo: {
        color: THEME.textPrimary, 
    },

    contentContainer: { 
        flex: 1, 
        backgroundColor: THEME.background, 
    }, 
    
    // --- Estilos Aba "Meus Itens" ---
    subtitulo: { 
        fontSize: 15, 
        color: THEME.textSecondary, 
        marginTop: 20, 
        marginBottom: 10, 
        paddingHorizontal: 25, 
        fontFamily: 'Poppins-Regular', 
    },
    flatListContent: {
        paddingBottom: 20,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    emptyItensContainer: { 
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    emptyCardAdicionar: { 
        width: CARD_WIDTH, 
        height: CARD_HEIGHT, 
        backgroundColor: '#E8F8EE', 
        borderRadius: 10, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 5, 
    },
    emptyAdicionarTexto: { 
        fontSize: 14, 
        textAlign: 'center', 
        marginTop: 8, 
        color: '#349E65', 
        fontFamily: 'Poppins-Medium', 
    },
    card: { 
        width: CARD_WIDTH, 
        height: CARD_HEIGHT, 
        backgroundColor: THEME.card, 
        margin: 5, 
        borderRadius: 10, 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 10, 
    },
    produtoImagem: { 
        width: '85%', 
        height: '60%', 
        resizeMode: 'contain', 
        marginTop: 5 
    },
    cardQuantidade: { 
        fontSize: 13, 
        color: THEME.textPrimary, 
        fontFamily: 'Poppins-Medium', 
        textAlign: 'center', 
        marginBottom: 5 
    },
    cardAdicionar: { 
        width: CARD_WIDTH, 
        height: CARD_HEIGHT, 
        backgroundColor: '#E8F8EE', 
        borderRadius: 10, 
        justifyContent: 'center', 
        alignItems: 'center', 
        margin: 5, 
        padding: 5 
    },
    adicionarTexto: { 
        fontSize: 14, 
        textAlign: 'center', 
        marginTop: 8, 
        color: '#349E65', 
        fontFamily: 'Poppins-Medium', 
    },
    
    // --- Estilos Aba "Lista de Compras" (ATUALIZADOS) ---
    containerVazio: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 40, 
        backgroundColor: THEME.background 
    },
    textoVazio: { 
        fontFamily: 'Poppins-Medium', 
        fontSize: 17, 
        textAlign: 'center', 
        color: THEME.textSecondary, 
        marginBottom: 25, 
    },
    botaoCriarLista: { 
        backgroundColor: THEME.green, 
        paddingVertical: 12, 
        paddingHorizontal: 30, 
        borderRadius: 25, 
    },
    textoBotaoCriarLista: { 
        color: THEME.white, 
        fontFamily: 'Poppins-Bold', 
        fontSize: 16, 
    },
    listaContainer: { 
        flex: 1, // Permite que o KAV funcione
        paddingHorizontal: 20, 
        paddingTop: 24, 
    },
    listaCard: { 
        backgroundColor: THEME.card, 
        borderRadius: 12, 
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        // Removido flex: 1. A altura será baseada no conteúdo.
        // Adiciona uma altura mínima para quando estiver vazio
        minHeight: 200, 
        maxHeight: '90%', // Garante que não preencha a tela inteira
    },
    listaHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#F0F0F0', 
        paddingBottom: 12, 
    },
    listaTitulo: { 
        fontFamily: 'Poppins-Bold', 
        fontSize: 20, 
        color: THEME.textPrimary,
        flex: 1, // Permite que o input cresça
    },
    listaTituloInput: {
        borderBottomWidth: 1,
        borderColor: THEME.green,
        paddingBottom: 4,
    },
    infoIcon: {
        paddingLeft: 12, // Espaço para o lápis não colar no texto
    },
    listaItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 10, 
    },
    listaItemTexto: { 
        fontSize: 16, 
        color: THEME.textPrimary, 
        fontFamily: 'Poppins-Medium', 
        marginLeft: 12, 
        flexShrink: 1,
    },
    listaItemTextoComprado: { 
        textDecorationLine: 'line-through', 
        color: '#BDBDBD', 
    },
    listaVaziaTexto: {
        textAlign: 'center', 
        color: THEME.textSecondary, 
        fontFamily: 'Poppins-Regular', 
        fontSize: 15, 
        paddingVertical: 20, // Adiciona padding
    },
    // Input inline para novo item
    listaItemInput: {
        fontSize: 16,
        color: THEME.textPrimary,
        fontFamily: 'Poppins-Medium',
        marginLeft: 12,
        flex: 1, // Ocupa o resto do espaço
        paddingVertical: 0, // Remove padding vertical padrão
    },
    adicionarItemButton: { 
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20, 
        paddingVertical: 8,
    },
    adicionarItemTexto: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: THEME.textPrimary,
        marginLeft: 10,
    },
    // Footer da lista (dica + lixeira)
    listaFooterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        paddingBottom: 10,
    },
    dicaRemoverTexto: { 
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: THEME.textSecondary,
        textAlign: 'left', // Alinhado à esquerda
    },
    
    // --- Estilos de Modal Removidos ---
    modalBackdrop: {},
    modalCard: {},
    modalTitle: {},
    modalInput: {},
    modalButton: {},
    modalButtonDisabled: {},
    modalButtonText: {},
});