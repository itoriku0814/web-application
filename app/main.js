// Vue3のComposition APIから必要な関数をインポート
const { createApp, ref, computed, onMounted } = Vue;

// Vueアプリケーションを作成
createApp({
    // setup()メソッド内にアプリケーションのロジックを記述
    setup() {
        // --- リアクティブな状態定義 (ref) ---
        // ref()で囲むことで、値が変更されると自動的に画面が更新される
        const memos = ref([]); // メモのリスト
        const newMemo = ref({ // 新規メモの入力データ
            title: '',
            content: '',
            image: '',
            category: ''
        });
        const searchQuery = ref(''); // 検索クエリ
        const selectedCategory = ref(''); // 選択されたカテゴリ

        // APIのベースURL
        const API_URL = 'http://localhost:3000/memos';

        // --- メソッド定義 ---

        // サーバーからすべてのメモを取得する関数
        const fetchMemos = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error('Network response was not ok.');
                memos.value = await response.json();
                // サーバーから取得したデータを元にソート
                memos.value.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } catch (error) {
                console.error('Failed to fetch memos:', error);
                alert('メモの読み込みに失敗しました。');
            }
        };

        // 新しいメモをサーバーに登録する関数
        const addMemo = async () => {
            // 入力チェック
            if (!newMemo.value.title || !newMemo.value.content || !newMemo.value.category) {
                alert('すべての項目を入力してください。');
                return;
            }

            try {
                const memoToAdd = {
                    ...newMemo.value,
                    createdAt: new Date().toISOString() // 現在時刻を追加
                };

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(memoToAdd)
                });

                if (!response.ok) throw new Error('Failed to add memo.');

                // フォームをリセット
                newMemo.value = { title: '', content: '', image: '', category: '' };
                // ファイル入力もリセット
                document.getElementById('image').value = '';
                
                // 再度データを取得してリストを更新
                fetchMemos(); 

            } catch (error) {
                console.error('Failed to add memo:', error);
                alert('メモの登録に失敗しました。');
            }
        };

        // 画像ファイルが選択されたときに呼ばれる関数
        const handleImageUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // FileReaderを使って画像をBase64形式の文字列に変換
            // これにより、画像をJSONデータとしてサーバーに送ることができる
            const reader = new FileReader();
            reader.onload = (e) => {
                newMemo.value.image = e.target.result;
            };
            reader.onerror = (error) => {
                console.error('File could not be read:', error);
                alert('画像の読み込みに失敗しました。');
            };
            reader.readAsDataURL(file);
        };

        // 画像の読み込みに失敗したときの代替処理
        const imageError = (event) => {
            event.target.src = 'https://placehold.co/600x400/cccccc/ffffff?text=No+Image';
        };


        // --- 算出プロパティ (computed) ---
        // 既存のデータから計算して新しいデータを作り出す

        // 利用可能なカテゴリのリストを動的に生成
        const categories = computed(() => {
            // Setを使って重複しないカテゴリのリストを作成
            const uniqueCategories = new Set(memos.value.map(memo => memo.category));
            return Array.from(uniqueCategories);
        });

        // 検索とカテゴリフィルタリングを適用したメモのリスト
        const filteredMemos = computed(() => {
            return memos.value.filter(memo => {
                // カテゴリが一致するかチェック (「すべて」の場合は常にtrue)
                const categoryMatch = !selectedCategory.value || memo.category === selectedCategory.value;
                
                // 検索クエリがタイトルまたは内容に含まれるかチェック (小文字に変換して比較)
                const searchMatch = memo.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                                    memo.content.toLowerCase().includes(searchQuery.value.toLowerCase());
                
                return categoryMatch && searchMatch;
            });
        });


        // --- ライフサイクルフック ---
        
        // onMounted: Vueコンポーネントが画面に表示された直後に実行される
        onMounted(() => {
            fetchMemos(); // 初期データを読み込む
        });


        // --- setup()の戻り値 ---
        // HTMLテンプレートから利用したいデータやメソッドを返す
        return {
            memos,
            newMemo,
            searchQuery,
            selectedCategory,
            categories,
            filteredMemos,
            addMemo,
            handleImageUpload,
            imageError,
        };
    }
}).mount('#app'); // id="app"の要素にVueアプリケーションをマウント
