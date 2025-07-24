const { createApp } = Vue;

createApp({
    data() {
        return {
            currentView: 'list',
            memos: [],
            categories: [
                { id: 'work', name: '仕事', color: '#3b82f6' },
                { id: 'personal', name: 'プライベート', color: '#10b981' },
                { id: 'study', name: '勉強', color: '#f59e0b' },
                { id: 'other', name: 'その他', color: '#6b7280' }
            ],
            filteredMemos: [],
            searchQuery: '',
            selectedCategory: '',
            selectedMemo: null,
            notification: null,
            newMemo: {
                title: '',
                content: '',
                category: '',
                image: null,
                tagsString: ''
            },
            // LocalStorageキー（Netlifyでは使えないので、メモリストレージとして使用）
            memoryStorage: {
                memos: [
                    {
                        id: 1,
                        title: "サンプルメモ",
                        content: "これはサンプルのメモです。Netlify環境でも動作します！",
                        category: "work",
                        image: null,
                        createdAt: new Date().toISOString(),
                        tags: ["サンプル", "テスト", "Netlify"]
                    },
                    {
                        id: 2,
                        title: "写真付きメモ",
                        content: "写真を添付したメモの例です。画像も正常に表示されます。",
                        category: "personal",
                        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzRmYjNkOSIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5ldGxpZnkgU2FtcGxlPC90ZXh0Pgo8L3N2Zz4=",
                        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1日前
                        tags: ["写真", "サンプル", "デモ"]
                    }
                ]
            }
        };
    },
    
    mounted() {
        this.loadData();
        this.filteredMemos = this.memos;
    },
    
    methods: {
        // データの読み込み（メモリストレージから）
        loadData() {
            try {
                // Netlify環境では、メモリストレージからデータを読み込み
                this.memos = [...this.memoryStorage.memos];
                this.filteredMemos = this.memos;
                this.showNotification('データを読み込みました (Netlify版)', 'success');
            } catch (error) {
                console.error('データの読み込みに失敗しました:', error);
                this.showNotification('データの読み込みに失敗しました', 'error');
            }
        },
        
        // メモ検索
        searchMemos() {
            let filtered = this.memos;
            
            // テキスト検索
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(memo => 
                    memo.title.toLowerCase().includes(query) ||
                    memo.content.toLowerCase().includes(query) ||
                    (memo.tags && memo.tags.some(tag => tag.toLowerCase().includes(query)))
                );
            }
            
            // カテゴリフィルタ
            if (this.selectedCategory) {
                filtered = filtered.filter(memo => memo.category === this.selectedCategory);
            }
            
            this.filteredMemos = filtered;
        },
        
        // メモ追加（メモリストレージに保存）
        addMemo() {
            if (!this.newMemo.title.trim() || !this.newMemo.content.trim() || !this.newMemo.category) {
                this.showNotification('必須項目を入力してください', 'error');
                return;
            }
            
            try {
                const tags = this.newMemo.tagsString
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
                
                const newMemo = {
                    id: Date.now(), // 簡単なID生成
                    title: this.newMemo.title,
                    content: this.newMemo.content,
                    category: this.newMemo.category,
                    image: this.newMemo.image,
                    tags: tags,
                    createdAt: new Date().toISOString()
                };
                
                // メモリストレージに追加
                this.memos.unshift(newMemo);
                this.memoryStorage.memos.unshift(newMemo);
                
                this.searchMemos();
                this.resetForm();
                this.currentView = 'list';
                this.showNotification('メモを追加しました', 'success');
                
            } catch (error) {
                console.error('メモ追加エラー:', error);
                this.showNotification('メモの追加に失敗しました', 'error');
            }
        },
        
        // メモ削除（メモリストレージから削除）
        deleteMemo(id) {
            if (!confirm('このメモを削除しますか？')) {
                return;
            }
            
            try {
                this.memos = this.memos.filter(memo => memo.id !== id);
                this.memoryStorage.memos = this.memoryStorage.memos.filter(memo => memo.id !== id);
                this.searchMemos();
                this.showNotification('メモを削除しました', 'success');
            } catch (error) {
                console.error('メモ削除エラー:', error);
                this.showNotification('メモの削除に失敗しました', 'error');
            }
        },
        
        // 画像アップロード処理
        handleImageUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // ファイルサイズチェック（5MB制限）
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('画像ファイルは5MB以下にしてください', 'error');
                return;
            }
            
            // 画像ファイルかチェック
            if (!file.type.startsWith('image/')) {
                this.showNotification('画像ファイルを選択してください', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.newMemo.image = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        
        // 画像削除
        removeImage() {
            this.newMemo.image = null;
            this.$refs.fileInput.value = '';
        },
        
        // フォームリセット
        resetForm() {
            this.newMemo = {
                title: '',
                content: '',
                category: '',
                image: null,
                tagsString: ''
            };
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },
        
        // カテゴリ別メモ取得
        getMemosByCategory(categoryId) {
            return this.memos.filter(memo => memo.category === categoryId);
        },
        
        // カテゴリ名取得
        getCategoryName(categoryId) {
            const category = this.categories.find(cat => cat.id === categoryId);
            return category ? category.name : 'その他';
        },
        
        // カテゴリ色取得
        getCategoryColor(categoryId) {
            const category = this.categories.find(cat => cat.id === categoryId);
            return category ? category.color : '#6b7280';
        },
        
        // 日付フォーマット
        formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now - date;
            
            // 1分未満
            if (diff < 60000) {
                return 'たった今';
            }
            
            // 1時間未満
            if (diff < 3600000) {
                const minutes = Math.floor(diff / 60000);
                return `${minutes}分前`;
            }
            
            // 24時間未満
            if (diff < 86400000) {
                const hours = Math.floor(diff / 3600000);
                return `${hours}時間前`;
            }
            
            // 7日未満
            if (diff < 604800000) {
                const days = Math.floor(diff / 86400000);
                return `${days}日前`;
            }
            
            // それ以外は日付表示
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        // 通知表示
        showNotification(message, type = 'info') {
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                info: 'fas fa-info-circle'
            };
            
            this.notification = {
                message,
                type,
                icon: icons[type] || icons.info
            };
            
            // 3秒後に自動で消す
            setTimeout(() => {
                this.notification = null;
            }, 3000);
        }
    },
    
    // 検索クエリとカテゴリフィルタの変更を監視
    watch: {
        searchQuery() {
            this.searchMemos();
        },
        selectedCategory() {
            this.searchMemos();
        }
    }
}).mount('#app');