const Excel = React.createClass({
	displayName: 'Excel',
	propTypes: {
		headers: React.PropTypes.arrayOf(
			React.PropTypes.string
		),
		initialData: React.PropTypes.arrayOf(
			React.PropTypes.arrayOf(
				React.PropTypes.string
			)
		)
	},
	getInitialState: function() {
		return {
			data: this.props.initialDate,
			sortby: null,   
			descending: false,
			search: false,
			edit: null   //{row: index, cell: index}
		}
	},
	_log: {
		states:[],
		curPos: -1
	},
	_logSetState(newState) {
		if (this._log.states.length === 0) {
			this._log.states.push(JSON.parse(JSON.stringify(this.state)))
			this._log.curPos = this._log.states.length - 1
		}
		this._log.states.push(JSON.parse(JSON.stringify(newState)))
		this._log.curPos = this._log.states.length - 1
		this.setState(newState)
	},
	_sort(env) {
		const column = env.target.cellIndex
		const descending = this.state.sortby === column && !this.state.descending
		let data = this.state.data.slice()
		data.sort(function(a, b) {
			return descending 
						?(a[column] < b[column])
						:(a[column] > b[column])
		})
		this._logSetState({
			data: data,
			sortby: column,
			descending: descending,
			edit: null,
			search: false
		})
	},
	_showEditor(env) {
		this._logSetState({
			edit: {
				row: parseInt(env.target.dataset.row, 10),
				cell: env.target.cellIndex
			}
		})
	},
	_save(env) {
		env.preventDefault()
		const input = env.target.firstChild
		const data = this.state.data.slice()
		data[this.state.edit.row][this.state.edit.cell] = input.value
		this._logSetState({
			data: data,
			edit: null
		})
	},
	_toggleSearch(env) {
		if (this.state.search) {
			this.setState({
				data: this._preSearchData,
				search: false
			})
			this._preSearchData = null
		} else {
			this._preSearchData = this.state.data
			this.setState({
				search: true
			})
		}
	},
	_preSearchData: null,
	_search(env) {
		const neddle = env.target.value.toLowerCase()
		if (!neddle) {
			this.setState({data: this._preSearchData})
			return
		}
		const idx = env.target.dataset.idx
		let searchData = this._preSearchData.filter((row) => {
			return row[idx].toString().toLowerCase().indexOf(neddle) > -1
		})
		this.setState({data: searchData})
	},
	_redraw() {
		var self = this
		if(this._log.curPos < 1) {
			alert('no state to redraw')
			return
		} else {
			self.setState(self._log.states[--self._log.curPos])
		}
	},
	_predraw() {
		var self = this
		if(this._log.curPos == this._log.states.length - 1) {
			alert('no state to predraw')
			return
		} else {
			self.setState(self._log.states[++self._log.curPos])
		}
	},
	_renderToolbar() {
		const self = this
		return (
			React.createElement("div", {style: {marginBottom: '10px'}}, 
				React.createElement("button", {onClick: self._redraw, className: "toolbar"}, "⇦"), 
				React.createElement("button", {onClick: self._predraw, className: "toolbar"}, "⇨"), 
				React.createElement("button", {onClick: self._toggleSearch, className: "toolbar"}, "搜索")
			)					
		)
	},
	_renderTable() {
		const self = this
		return (
			React.createElement("table", {onDoubleClick: self._showEditor, className: "table"}, 
				React.createElement("thead", {onClick: self._sort}, 
					React.createElement("tr", null, 
						this.props.headers.map((title, idx) => {
							if (this.state.sortby === idx) {
								title += this.state.descending ? '\u2191' : '\u2193';
							}
							return (
								React.createElement("th", {key: idx, className: "th"}, title)
							)
						})
					)
				), 
				self._renderSearch(), 
				React.createElement("tbody", null, 
					this.state.data.map((row, rowidx) => {
						return (
							React.createElement("tr", {key: rowidx}, 
								row.map((cell, idx) => {
									const edit = self.state.edit;
									let editClass = "";
									if (edit && edit.row === rowidx && edit.cell === idx) {
										cell = (
											React.createElement("form", {onSubmit: self._save}, 
												React.createElement("input", {type: "text", defaultValue: cell, className: "edit"})
											)
										)
										editClass="editing";
									}
									return React.createElement("td", {key: idx, "data-row": rowidx, className: "td " + editClass}, cell)
								})
							)
						)
					})
				)
			)
		)
	},
	_renderSearch: function() {
		if (!this.state.search) {
			return null
		}
		return (
			React.createElement("tr", {onChange: this._search}, 
				this.props.headers.map((_ignore, idx) => {
					return (
						React.createElement("td", {key: idx, className: "search"}, 
							React.createElement("input", {type: "text", "data-idx": idx})
						))
				})
			)
		) 
	},
	render: function() {
		return (
			React.DOM.div(null, 
				this._renderToolbar(),
				this._renderTable()
			)
		)
	}
})

React.render(
	React.createElement(Excel, {
		headers: excelData.header,
		initialDate: excelData.body
	}),
	document.getElementById('reactExcel')
)