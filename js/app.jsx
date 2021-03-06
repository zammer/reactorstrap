var React           = require('react/addons'),
    Immutable       = require('immutable'),
    Bootstrap       = require('react-bootstrap'),
    DOM             = React.DOM,
    Grid            = Bootstrap.Grid,
    Row             = Bootstrap.Row,
    Col             = Bootstrap.Col;

var Configurator    = require('./Configurator.jsx'),
    Catalog         = require('./Catalog.jsx'),
    TreePreview     = require('./TreePreview.jsx'),
    smartDefaults   = require('./smartDefaults.jsx'),
    Reveal          = require('./Utils.jsx').Reveal,
    utils           = require('./utils'),
    assign   = utils.assign,
    assoc    = utils.assoc,
    identity = utils.identity;

var findElem = function(name) {
  return Bootstrap[name] || DOM[name];
};

var Preview = React.createClass({
  getInitialState: function() {
    return {};
  },
  renderNode: function(tree, idx) {
    if(typeof tree == "string") return tree;
    var props    = assign(tree.props, {key: tree.props.key || (tree.name || 'noname') + idx});
    var children = tree.children.map(function(x, y) {
      return this.renderNode(x, y);
    }, this)
    return findElem(tree.name)(props, children);
  },
  render: function() {
    return <div className={!this.props.fullscreen && "previewer"}>
      {this.renderNode(this.props.tree, 0)}
    </div>;
  }
})


var Reactor = React.createClass({
  getInitialState: function() {
    return {tree: smartDefaults.starter, fullscreen: false,
            history: [smartDefaults.starter], currentHistory: 0,
            editing: null};
  },
  componentDidMount: function() {
    document.addEventListener('keyup', function(e) {
      if(e.keyCode == 27)
        this.setState({fullscreen: false});
    }.bind(this));
  },
  onSelectNodeFromTree: function(path) {
    this.setState({currentPath: path});
  },
  onAddComponent: function(path) {

    this.setState({dragging: false, currentPath: path});
    if(path) this.setState({editing: path.concat('children').concat(0)})
  },
  onUpdateTree: function(tree) {
    this.setState({tree: tree, history: this.state.history.concat(tree), currentHistory: this.state.history.length});
  },
  currentProps: function() {
    var path = this.state.currentPath;
    if(!path) return;
    return this.currentData('props', path).delete('key').toJS();
  },
  currentElem: function() {
    var path = this.state.currentPath;
    if(!path) return;
    return findElem(this.currentName()).type.propTypes;
  },
  currentName: function() {
    var path = this.state.currentPath;
    if(!path) return;
    return this.currentData('name', path);
  },
  currentData: function(sub, path) {
    return Immutable.fromJS(this.state.tree).getIn(path.concat(sub));
  },
  onChangeProps: function(k,v) {
    var path = this.state.currentPath;
    var newTree = Immutable.fromJS(this.state.tree)
                           .updateIn(path.concat(['props', k]), identity(v)).toJS();
    this.setState({tree: newTree});
  },
  onDrag: function(component) {
    this.setState({dragging: component});
  },
  onDragEnd: function() {
    this.setState({dragging: false});
  },
  fullscreen: function() {
    this.setState({fullscreen: true});
  },
  moveHistory: function(idx) {
    this.setState({tree: this.state.history[idx], currentPath: undefined, currentHistory: idx});
  },
  addEditing: function(id) {
    this.setState({editing: id})
  },
  onSaveApp: function(name) {
    window.localStorage.setItem(name, JSON.stringify(this.state.tree))
  },
  onLoadApp: function(name) {
    var app = JSON.parse(window.localStorage.getItem(name))
    this.setState({tree: app})
  },
  render: function() {
    return <div className="container-fluid">
        <Row>
          <Reveal first={!this.state.fullscreen}>
            <div>
              <Col md={1} className="large-col">
                <Catalog onDrag={this.onDrag} onDragEnd={this.onDragEnd} />
              </Col>
              <Col md={2}>
                <TreePreview tree={this.state.tree}
                             addComponent={this.onAddComponent}
                             selectNode={this.onSelectNodeFromTree}
                             updateTree={this.onUpdateTree}
                             dragging={this.state.dragging}
                             selectedPath={this.state.currentPath}
                             addEditing={this.addEditing}
                             editing={this.state.editing}
                             />
              </Col>
              <Col md={7}>
                <Preview tree={this.state.tree} root={this.state.root}/>
              </Col>
              <Col md={2}>
                <Configurator props={this.currentProps()}
                              pureProps={this.currentElem()}
                              currentName={this.currentName()}
                              changeProps={this.onChangeProps}
                              fullscreen={this.fullscreen}
                              history={this.state.history}
                              moveHistory={this.moveHistory}
                              currentHistory={this.state.currentHistory}
                              saveApp={this.onSaveApp}
                              loadApp={this.onLoadApp}
                              />
              </Col>
            </div>
            <Preview tree={this.state.tree} root={this.state.root} fullscreen={true}/>
          </Reveal>
        </Row>
    </div>;
  }
})

React.renderComponent(
  <Reactor/>,
  document.getElementById('app')
);