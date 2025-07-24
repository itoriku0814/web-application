const { createApp } = Vue;

createApp({
    data() {
        return {
            currentView: 'list',
            memos: [],
            categories: [],
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
            }
        };
    },
    
    async mounted() {
        await this.loadData();
        this.filteredMemos = this.memos;
    },
    
    methods: {
        // データの読み込み
        async loadData() {
            try {
                const [memosResponse, categoriesResponse] = await Promise.all([
                    fetch('http://localhost:3000/memos'),
                    fetch('http://localhost:3000/categories')
                ]);
                
                this.memos = await memosResponse.json();
                this.categories = await categoriesResponse.json();
                this.filteredMemos = this.memos;
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
        
        // メモ追加
        async addMemo() {
            if (!this.newMemo.title.trim() || !this.newMemo.content.trim() || !this.newMemo.category) {
                this.showNotification('必須項目を入力してください', 'error');
                return;
            }
            
            try {
                const tags = this.newMemo.tagsString
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
                
                const memoData = {
                    title: this.newMemo.title,
                    content: this.newMemo.content,
                    category: this.newMemo.category,
                    image: this.newMemo.image,
                    tags: tags,
                    createdAt: new Date().toISOString()
                };
                
                const response = await fetch('http://localhost:3000/memos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(memoData)
                });
                
                if (response.ok) {
                    const newMemo = await response.json();
                    this.memos.unshift(newMemo);
                    this.searchMemos();
                    this.resetForm();
                    this.currentView = 'list';
                    this.showNotification('メモを追加しました', 'success');
                } else {
                    throw new Error('メモの追加に失敗しました');
                }
            } catch (error) {
                console.error('メモ追加エラー:', error);
                this.showNotification('メモの追加に失敗しました', 'error');
            }
        },
        
        // メモ削除
        async deleteMemo(id) {
            if (!confirm('このメモを削除しますか？')) {
                return;
            }
            
            try {
                const response = await fetch(`http://localhost:3000/memos/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.memos = this.memos.filter(memo => memo.id !== id);
                    this.searchMemos();
                    this.showNotification('メモを削除しました', 'success');
                } else {
                    throw new Error('メモの削除に失敗しました');
                }
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