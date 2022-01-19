class AudioGraph {

  constructor(data, parentId, audioContainerId, buttonContainerId, 
              isJsPsych, params) {

    this.num_items = data.nodes.length;
    this.nodes = data.nodes
    this.parentId = parentId
    this.audioContainerId = audioContainerId
    this.buttonContainerId = buttonContainerId
    this.draw_edges = params.draw_edges
    this.trial_id = params.trial_id
    this.opacity = params.opacity
    this.nextURL = params.nextURL
    this.loop = params.loop
    this.mute_key = params.mute_key
    if (isJsPsych) {
        this.buttonClass = "jspsych-btn"
        this.submitResults = submitResultsJsPsych.bind(params)
    } else {
        this.buttonClass = "btn btn-primary"
        this.submitResults = submitResults
    }

    this.width = params.width
    this.height = this.width
    this.max_len = Math.sqrt(this.width**2*2)*.5

    this.h = this.width/2
    this.k = this.width/2
    this.r = this.width/2-30

    this.play = true
    this.highlighted = -1
    this.hovered = -1
    this.d_next = -1
    this.circle_next = -1
    this.audios = []

    this.style = {
      'border_width_1': 1,
      'border_width_2': 5,
      'border_color_1': 'black',
      'border_color_2': 'rgba(0,0,0,0.35)'
    }
    this.edge_on_hover = false

    // load audio
    this.setupAudio()

  }

  circle_size_1(self, d) {
    return 10
  }

  circle_size_2(self, d) {
    return self.circle_size_1(self,d)+2
  }

  getStrokeOn() {
    var stroke = 'rgba(0,0,0,1)'
    var stroke_width = 1
    return [stroke, stroke_width]
  }

  getStrokeOff() {
    var stroke = 'rgba(0,0,0,0)'
    var stroke_width = 1
    return [stroke, stroke_width]
  }

  unblockAudio() {
    var i, player
    for (i=0; i<this.nodes.length; i++) {
      player = document.getElementById('page-audio-'+this.nodes[i].id)
      player.play()
      player.pause()
      player.currentTime = 0
    }
  }

  startFcn() {
    this.unblockAudio()
    this.layout()
    this.draw()
    this.setupHover()
    this.setupDrag()
    this.start_btn.disabled = true
    this.time_0 = Date.now()
  }

  readyFcn() {
    this.submit_btn.disabled = false
  }

  submitFcn() {
    var results = []
    for (var i=0; i<this.nodes.length; i++) {
      var x = (this.nodes[i].x-this.h)/this.r/2
      var y = (this.nodes[i].y-this.k)/this.r/2
      results.push({'id': this.nodes[i].id, 'audiofile': this.nodes[i].audiofile,
                    'values': [x, y], 
                    'elapsed': this.audios[i].elapsed/this.audios[i].duration})
    }
    this.submitResults({'type': 'circle', 'trial_id': this.trial_id,
                        'ratingtype': 'similarity', labels: '',
                        'results': results, 'time': Date.now()-this.time_0},
                        this.nextURL)
  }

  build() {
    if (this.buttonContainerId.length==0) {
      this.startFcn()
    } else {   
      this.start_btn = document.createElement("BUTTON");
      this.start_btn.innerHTML = 'Start'
      this.start_btn.className += this.buttonClass
      this.start_btn.addEventListener("click", this.startFcn.bind(this))
      
      this.submit_btn = document.createElement("BUTTON");
      this.submit_btn.innerHTML = 'Submit'
      this.submit_btn.className += this.buttonClass
      this.submit_btn.disabled = true
      this.submit_btn.addEventListener("click", this.submitFcn.bind(this))
      
      this.mute_icon = document.createElement("OBJECT");
      this.mute_icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="25" height="25" viewBox="0 0 75 75"
        stroke="#111" stroke-width="5">
        <path d="m39,14-17,15H6V48H22l17,15z" fill="#111" stroke-linejoin="round"/>
        <path d="m49,26 20,24m0-24-20,24" fill="none" stroke-linecap="round"/>
        </svg>
      `      
      this.mute_icon.id = 'mute-icon'
      this.mute_icon.style.visibility = 'hidden'

      var spaceholder = document.createElement("OBJECT");
      spaceholder.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="25" height="25" viewBox="0 0 75 75"
        stroke="#111" stroke-width="5">
        </svg>
      `   
      spaceholder.id = 'spaceholder'

      document.getElementById(this.buttonContainerId).appendChild(spaceholder)
      document.getElementById(this.buttonContainerId).appendChild(this.start_btn)
      document.getElementById(this.buttonContainerId).appendChild(this.submit_btn)
      document.getElementById(this.buttonContainerId).appendChild(this.mute_icon)
    }
  }

  setupAudio() {
    const tracks = []
    var player_id, player, i
    for (i=0; i<this.num_items; i++) {
      player_id = 'page-audio-'+this.nodes[i].id
      if (!!document.getElementById(player_id)) {
        console.log('audiofile id already loaded')
      } else {
        this.audios.push({duration: 0., elapsed: 0., started: 0.})
        document.getElementById(this.audioContainerId).innerHTML += '<audio id="'+player_id+'"></audio>'
        if (this.nodes[i].audiofile.length>0) {
          showPlaybackTools(this.nodes[i].audiofile, this.nodes[i].id, this.loop)
        } else {
          requestAudio(this.nodes[i].id)
        }
      }
      this.nodes[i].duration = 0.
      this.nodes[i].elapsed = 0.
      this.nodes[i].started = 0
      if (!('audioindex' in this.nodes[i])) {
        this.nodes[i].audioindex = i
      }
    }
  }

  layout() {
    var alphas = makeArray(-3.141592653589793,3.141592653589793,this.num_items+1).slice(1,)
    this.links = []
    var i, j, link
    for (i=0; i<this.nodes.length; i++) {
      if (this.nodes[i].x=='') {
        this.nodes[i].x = Math.sin(alphas[i])*(this.r+15)+this.k
        this.nodes[i].y = Math.cos(alphas[i])*(this.r+15)+this.h
      }
      for (j=i+1; j<this.nodes.length; j++) {
        link = {source: i, target: j}
        this.links.push(link)
      }
    }
  }

  drawBorder(svg) {
    var borderPath = svg.append("circle")
                        .attr('id', this.parentID+'-drop-box')
                        .attr("cx", this.h)
                        .attr("cy", this.k)
                        .attr("r", this.r)
                        .style("stroke", 'black')
                        .style("fill", "none")
  }

  colorSelect(self, i, colorpalette) {
    return colorpalette(i)
  }

  draw() {

    var edgeUpdate = this.edgeUpdate
    var edgeHide = this.edgeHide

    var html = '<svg id="'+this.parentId+'-svg" width="'+this.width+'" height="'+this.height+'">'
    document.getElementById(this.parentId).innerHTML += html
    this.svg = document.getElementById(this.parentId+'-svg')

    var svg = d3.select('#'+this.parentId+'-svg')

    this.drawBorder(svg)

    var nodes = this.nodes
    var links = this.links

    var self = this

    var colorpalette = this.get_colorpalette(self)

    this.edges = this.draw_edgelines(self, svg)
    this.circles = this.draw_nodes(self, svg)

    this.svg = svg
    // this.edges = edges

  }

  get_colorpalette(self) {
    if (self.num_colors()>10) {
      var colorpalette = d3.scaleOrdinal(d3.schemeCategory20);
    } else {
      var colorpalette = d3.scaleOrdinal(d3.schemeCategory10);
    }
    return colorpalette
  }

  draw_edgelines(self, svg) {
    var edges = svg.selectAll("link")
                    .data(self.links)
                    .enter()
                    .append("line")
                    .attr("class", "link")
                    .attr("x1", function(l) {
                      var sourceNode = self.nodes.filter(function(d, i) {
                        return i == l.source
                      })[0];
                      d3.select(this).attr("y1", sourceNode.y);
                      return sourceNode.x
                    })
                    .attr("x2", function(l) {
                      var targetNode = self.nodes.filter(function(d, i) {
                        return i == l.target
                      })[0];
                      d3.select(this).attr("y2", targetNode.y);
                      return targetNode.x
                    })
                    .attr("fill", "none")
                    .attr("stroke-width", 1)
                    .attr("stroke", "rgba(0,0,0,0)");
    return edges
  }

  draw_nodes(self, svg) {
    var colorpalette = self.get_colorpalette(self)
    var circles = svg.selectAll("node")
                     .data(self.nodes).enter()
                     .append("circle")
                     .attr("class", "node")
                     .attr("cx", function(d) {return d.x})
                     .attr("cy", function(d) {return d.y})
                     .attr("fill", function(d, i) {return self.colorSelect(self, i, colorpalette)})
                     .attr("id", function(d) {return d.id})
                     .attr("r", function(d, i) {return self.circle_size_1(self, d)})
                     // .attr("r", this.circle_size_1())
                     .style("opacity", this.opacity)
                     .style("stroke", 'black')
                     .style("stroke-width", self.style.border_width_1)
    return circles
  }

  num_colors() {
    return this.num_items
  }

  setupHover() {

    var style = this.style
    var self = this

    var svg = d3.select('#'+self.parentId+'-svg')
    var circles = svg.selectAll('.node')

    circles.on("mouseover", function(d, i) {
      self.mouseover(self, this, style, d, i)
    })

    circles.on("mouseout", function(d) {
      self.mouseout(self, this, style, d)
    })

    d3.select('body').on("keypress", function() {
      for (var i=0; i<self.audios.length; i++) {
      }    
      if (d3.event.key==self.mute_key){
        self.play = !self.play
        if (self.play) {
          self.mute_icon.style.visibility = 'hidden'
        } else {
          self.mute_icon.style.visibility = 'visible'
        }
        if (self.hovered>-1) {
          var hovered = self.hovered
          if (self.play) {
            self.mouseover(self, self.circle_next, style, self.d_next, self.hovered)
          } else {
            self.play = true // for updating 'elapsed' variable
            self.mouseout(self, self.circle_next, style, self.d_next)
            self.play = false
            self.hovered = hovered
          }
        }
      }
    })
  }

  mouseover(self, circle, style, d, i) {    
    self.hovered = i
    self.d_next = d
    self.circle_next = circle
    if ((self.play)&(self.highlighted==-1)&(!self.is_dragged)) {
      if (self.player) {
        self.player.pause()
      }
      self.audios[d.audioindex].started = Date.now()
      self.player = document.getElementById("page-audio-"+circle.id)
      self.highlighted = i
      self.player.play()
      d3.select(circle)
       .attr("r", self.circle_size_2(self, d))
       .style("stroke", style.border_color_2)
       .style("stroke-width", style.border_width_2)
    }
    if (self.edge_on_hover) {
      self.edgeShow(self, d, i, d.x, d.y)
    }
  }

  mouseout(self, circle, style, d) {
    if ((self.highlighted==self.hovered)&(!self.is_dragged)) {
      var audio = self.audios[d.audioindex]
      if (self.play) {
        audio.elapsed += (Date.now()-audio.started)/1000.
      }
      // console.log(audio.elapsed)
      self.edgeHide(self)
      self.player.pause()
      audio.duration = self.player.duration
      if (audio.elapsed>audio.duration) {
        var opacity = 1.
      } else {
        var opacity = this.opacity
      }
      // self.player.currentTime = 0
      self.highlighted = -1
      d3.select(circle)
        .attr("r", self.circle_size_1(self, d))
        .style("stroke", style.border_color_1)
        .style("stroke-width", style.border_width_1)
      d3.selectAll('.node')
        .filter(function(dd) { return dd.audioindex == d.audioindex; })
        .style("opacity", opacity)
    }
    self.hovered = -1
    if (self.all_in(self)) {
      self.readyFcn()
    }    
  }

  boundary(self,x,y,i) {
     var a = (y-self.k)
     var b = (x-self.h)
     var ro = Math.sqrt(a**2+b**2)
     if (ro>self.r) {
      var alpha = Math.atan(a/b)
      var xnew = Math.cos(alpha)*Math.sign(b)*self.r+self.h
      var ynew = Math.sin(alpha)*Math.sign(b)*self.r+self.k
     } else {
      var xnew = x
      var ynew = y
     }
     return [xnew, ynew]
  }

  is_in(self, x, y) {
    var a = (y-self.k)
    var b = (x-self.h)
    var ro = Math.sqrt(a**2+b**2)
    return Math.floor(ro)<=self.r
  }

  all_in(self) {
     var is_done = true
     var i = 0
     var audio
     while (is_done & (i<self.nodes.length)) {
       var player = document.getElementById('page-audio-'+String(self.nodes[i].id))
       audio = self.audios[self.nodes[i].audioindex]
       audio.duration = player.duration
       var is_listened = audio.elapsed>audio.duration
       var circle = document.getElementById(String(self.nodes[i].id))
       var x = circle.cx.animVal.value
       var y = circle.cy.animVal.value
       if (self.opacity<1.) {
         is_done = (self.is_in(self, x, y))&(is_listened)
       } else {
         is_done = self.is_in(self, x, y)
       }
       i++
     }
     return is_done
  }

  setupDrag() {
    var circles = this.circles
    var self = this

    circles.call(d3.drag()
                 .on("start", function(d) {
                   self.dragstarted(self, this, d)
                 })
                 .on("drag", function(d, i) {
                   self.dragged(self, this, d, i)
                 })
                 .on("end", function(d, i) {
                   self.dragended(self, this, d, i)
                 })
                 );
  }

  dragstarted(self, circle, d) {
    d3.select(circle).raise().classed("active", true);
    self.is_dragged = true
  }

  dragged(self, circle, d, i) {
     var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
     d3.select(circle).attr("cx", d.x = newpos[0]).attr("cy", d.y = newpos[1]);
     self.edgeUpdate(self, d, i, newpos[0], newpos[1])
  }

  dragended(self, circle, d, i) {
     d3.select(circle).classed("active", false);
     var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
     d3.select(circle).attr("cx", d.x = newpos[0]).attr("cy", d.y = newpos[1])
     self.edgeUpdate(self, d, i, newpos[0], newpos[1])
     self.edgeHide(self)
     if (self.all_in(self)) {
       self.readyFcn()
     }
     self.handle_dragend(self, circle, d, i)
  }

  handle_dragend(self, circle, d, i) {
    self.is_dragged = false
    if (self.highlighted!=self.hovered) {
      var next = self.hovered
      self.hovered = self.highlighted
      self.mouseout(self, circle, self.style, d)
      if (next!=-1) {
        var selection = self.svg.selectAll('.node')
        self.mouseover(self, self.circle_next, self.style, self.d_next, next)
      }
    }
  }

  getStroke(self, edge, l, i) {
    if (self.draw_edges) {
      if ((l.source == i)|(l.target == i)) {
        var weight = (edgeLength(edge)/self.max_len)
        var stroke = 'rgba(0,0,0,'+String(Math.max(1-weight,.1))+')'
        var stroke_width = Math.max(4-weight*4,.4)
      } else {
        var stroke = 'rgba(0,0,0,0)'
        var stroke_width = 1
      }
    } else {
      var stroke = 'rgba(0,0,0,0)'
      var stroke_width = 1
    }
    return [stroke, stroke_width]
  }

  edgeUpdate(self, d, i, x, y) {
    self.edges.each(function(l, li) {
      var stroke_params = self.getStroke(self, this, l, i)
      if (l.source == i) {
        d3.select(this).attr("x1", d.x = x).attr("y1", d.y = y);
      } else if (l.target == i) {
        d3.select(this).attr("x2", d.x = x).attr("y2", d.y = y);
      }
      d3.select(this).attr("stroke", stroke_params[0])
      d3.select(this).attr("stroke-width", stroke_params[1])
    });

  }

  edgeShow(self, d, i, x, y) {
    self.edges.each(function(l, li) {
      var stroke_params = self.getStroke(self, this, l, i)
      d3.select(this).attr("stroke", stroke_params[0])
      d3.select(this).attr("stroke-width", stroke_params[1])
    });
  }

  edgeHide(self) {
    self.edges.each(function(l, li) {
      d3.select(this).attr("stroke", 'rgba(0,0,0,0)')
    });
  }

  addText(x, y, text, font_size=15, anchor='middle', vanchor='central') {
    this.svg.innerHTML += '<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" '+
                        'alignment-baseline="'+vanchor+'" font-family="sans-serif" '+
                        'font-size="'+font_size+'px">'+text+'</text>'
  }

}

class CircleSortGraph extends AudioGraph {

  constructor(data, parentId, audioContainerId, buttonContainerId,
              isJsPsych, params) {
    super(data, parentId, audioContainerId, buttonContainerId, isJsPsych, params)
    this.num_in = 0
    this.num_clusters = 0
    this.last_cluster = 0
    this.clusterIndex = Array(self.num_items)
  }

  get_num_in(self) {
    var num = 0
    for (var j=0; j<self.nodes.length; j++) {
      if (self.is_in(self, self.nodes[j].x, self.nodes[j].y)) {
        num += 1
      }
    }
    return num
  }

  update_clusters(self, i) {
    var nn = self.getNearestNeighbor(self, i)
    // if nn is in a cluster already, put i in it
    if (self.clusterIndex[nn]) {
      self.clusterIndex[i] = self.clusterIndex[nn]
    } else { // if not, create new cluster
      self.clusterIndex[i] = self.last_cluster+1
      self.last_cluster += 1
    }
    // update number of clusters
    self.num_clusters = self.clusterIndex.filter(onlyUnique).length
  }

  dragged(self, circle, d, i) {
     var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
     d3.select(circle).attr("cx", d.x = newpos[0]).attr("cy", d.y = newpos[1]);
     self.edgeUpdateDrag(self, d, i, newpos[0], newpos[1])
  }

  dragended(self, circle, d, i) {
     d3.select(circle).classed("active", false);
     var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
     d3.select(circle).attr("cx", d.x = newpos[0]).attr("cy", d.y = newpos[1])
     self.nodes[i].x = newpos[0]
     self.nodes[i].y = newpos[1]
     self.edgeUpdate(self, d, i, newpos[0], newpos[1])
     self.edgeHide(self)
     self.num_in = self.get_num_in(self)
     self.update_clusters(self, i)
     self.min_len = Math.max(40, self.max_len/(1+self.num_in))
     if (self.all_in(self)) {
       self.readyFcn()
     }
     self.handle_dragend(self, circle, d, i)
  }

  getNearestNeighbor(self, i) {
    var min_len = self.min_len
    var nn = self.nodes.length+1
    var len
    for (var j=0; j<self.nodes.length; j++) {
      if ((j!=i)&self.is_in(self, self.nodes[j].x, self.nodes[j].y)) {
        len = computeLength(self.nodes[i].x, self.nodes[j].x, self.nodes[i].y, self.nodes[j].y)
        if (len<min_len) {
          min_len = len
          nn = j
        }
      }
    }
    return nn
  }

  edgeUpdateDrag(self, d, i, x, y) {
    var nn = self.getNearestNeighbor(self, i)
    var cluster = self.clusterIndex[nn]
    self.edges.each(function(l, li) {
      if (l.source == i) {
        d3.select(this).attr("x1", d.x = x).attr("y1", d.y = y);
      } else if (l.target == i) {
        d3.select(this).attr("x2", d.x = x).attr("y2", d.y = y);
      }
      if (
        (cluster>0)&(
        ((self.clusterIndex[l.target]==cluster)&(self.clusterIndex[l.source]==cluster))|
        ((l.target==i)&(self.clusterIndex[l.source]==cluster))|
        ((self.clusterIndex[l.target]==cluster)&(l.source==i))
      )) {
        var stroke_params = self.getStrokeOn()
      } else {
        var stroke_params = self.getStrokeOff()
      }
      d3.select(this).attr("stroke", stroke_params[0])
      d3.select(this).attr("stroke-width", stroke_params[1])
    });
  }

  submitFcn() {
    var results = []
    for (var i=0; i<this.nodes.length; i++) {
      results.push({'id': this.nodes[i].id, 'audiofile': this.nodes[i].audiofile,
                    'values': [this.clusterIndex[i]], 
                    'elapsed': this.audios[i].elapsed/this.audios[i].duration})
    }
    this.submitResults({'type': 'circlesort', 'trial_id': this.trial_id,
                        'ratingtype': 'cluster', 'labels': [''],
                        'results': results, 'time': Date.now()-this.time_0},
                        this.nextURL)
  }

}

class SquareAudioGraph extends AudioGraph {

  layout() {
    var alphas = makeArray(30,30+this.r*2,this.num_items)
    this.links = []
    var i, j, link
    for (i=0; i<this.nodes.length; i++) {
      if (this.nodes[i].x=='') {
        this.nodes[i].x = alphas[i]
        this.nodes[i].y = 15
      }
      for (j=i+1; j<this.nodes.length; j++) {
        link = {source: i, target: j}
        this.links.push(link)
      }
    }
  }

  drawBorder(svg) {
    var borderPath = svg.append("rect")
                        .attr('id', this.parentID+'-drop-box')
                          .attr("x", 30)
                          .attr("y", 30)
                        .attr("rx", 10)
                        .attr("ry", 10)
                          .attr("height", this.r*2)
                          .attr("width", this.r*2)
                        .style("stroke", 'black')
                        .style("fill", "none")
  }

  is_in(self, x, y) {
    var a = (y-self.k)
    var b = (x-self.h)
    return Boolean((Math.abs(a)<=self.r)&(Math.abs(a)<=self.r))
  }

  boundary(self,x,y,i) {
    var a = (x-self.h)
    var b = (y-self.k)
    var xnew = Math.min(Math.abs(a), self.r) * Math.sign(a) + self.h
    var ynew = Math.min(Math.abs(b), self.r) * Math.sign(b) + self.k
    return [xnew, ynew]
  }

}

class TripletStaticAudioGraph extends SquareAudioGraph {

  constructor(data, parentId, audioContainerId, buttonContainerId='',
              draw_edges=true, trial_id='', width=400, nextURL='',
              opacity=1., isJsPsych=false) {
    super(data, parentId, audioContainerId, buttonContainerId,
                draw_edges, trial_id, width, nextURL, opacity=opacity, isJsPsych)
    this.height = this.r/3+60
  }

  circle_size_1(self, d) {
    return 13
  }

  layout() {
    super.layout()
    for (i=0; i<3; i++) {
      this.nodes[i].y = 30 + this.r/6
      this.nodes[i].x = 30 + this.r/2 + this.r/6 + this.r/3*i
    }
  }

  drawBorder(svg) {
    var borderPath = svg.append("rect")
                        .attr('id', this.parentID+'-drop-box')
                          .attr("x", 30+this.r/2)
                          .attr("y", 30)
                        .attr("rx", 10)
                        .attr("ry", 10)
                          .attr("height", this.r/3)
                          .attr("width", this.r)
                        .style("stroke", 'black')
                        .style("fill", "none")
  }

  setupDrag() {

  }

}

class TripletAudioGraph extends SquareAudioGraph {

  constructor(data, parentId, audioContainerId, buttonContainerId,
              isJsPsych, params) {
    super(data, parentId, audioContainerId, buttonContainerId, isJsPsych, params)
    this.height = this.r/3+60
  }

  circle_size_1(self, d) {
    return 13
  }

  readyFcn() {
    // this.submit_btn.disabled = false
  }

  layout() {
    super.layout()
    for (var i=0; i<3; i++) {
      this.nodes[i].y = 30 + this.r/6
      this.nodes[i].x = 30 + this.r/2 + this.r/6 + this.r/3*i
      this.nodes[i].time = 0
    }
    for (i=3; i<this.nodes.length; i++) {
      this.nodes[i].y = 0
      this.nodes[i].x = 30 + this.r
      this.nodes[i].time = 0
    }
  }

  draw() {
    super.draw()
    var hidder = this.svg.append("rect")
                      .attr('id', 'hidder')
                      .attr("x", 0)
                      .attr("y", 0)
                      .attr("rx", 10)
                      .attr("ry", 10)
                      .attr("height", this.r*2+30)
                      .attr("width", this.r*2+60)
                      .style("stroke", "none")
                      .style("fill", "white")

    d3.select('#'+this.parentID+'-drop-box').raise()

    d3.selectAll(".node")
      .style("opacity", 0.)
      .raise()

    d3.selectAll(".node")
      .filter(function(d, i) {
          return i < 3;
      })
      .raise()
      .style('opacity', this.opacity)

  }

  drawBorder(svg) {
    var borderPath = svg.append("rect")
                        .attr('id', this.parentID+'-drop-box')
                          .attr("x", 30+this.r/2)
                          .attr("y", 30)
                        .attr("rx", 10)
                        .attr("ry", 10)
                          .attr("height", this.r/3)
                          .attr("width", this.r)
                        .style("stroke", 'black')
                        .style("fill", "none")
  }

  mouseover(self, circle, style, d, i) {
    var x = parseFloat(circle.cx.animVal.value)
    var y = parseFloat(circle.cy.animVal.value)
    if (self.is_in(self, x, y)) {
      super.mouseover(self, circle, style, d, i)
    }
  }  

  mouseout(self, circle, style, d) {
    var x = parseFloat(circle.cx.animVal.value)
    var y = parseFloat(circle.cy.animVal.value)    
    if (self.is_in(self, x, y)) {
      super.mouseout(self, circle, style, d)
    }
  }    

  setupDrag() {
    var circles = this.svg.selectAll('circle')
    self = this
    circles.on("click", function() {
      var circle = this
      var cx = circle.cx.animVal.value
      var cy = circle.cy.animVal.value
      if (self.is_in(self, parseFloat(cx), parseFloat(cy))) {      
        var num_completed = 0
        for (var i=0; i<self.nodes.length; i++) {
          if (self.nodes[i].id==circle.id) {
            var i_node = i
          }
          if (self.nodes[i].completed>0) {
            num_completed += 1
          }
        }
        self.nodes[i_node].completed = Date.now()-self.time_0
        d3.selectAll(".node")
          .filter(function(d, i) {
              return d.id == circle.id;
          })
          .attr("cy", self.r)
          .attr("cx", num_completed-30)

        if ((self.nodes.length-num_completed)>3) {
          d3.selectAll(".node")
            .filter(function(d, i) {
                return i == 0;
            })
            .raise()
            .transition().duration(200)
            .attr("cx", cx)
            .attr("cy", cy)
            .style("opacity", self.opacity)
        } else if ((self.nodes.length-num_completed)==3) {
          self.submitFcn(self.nodes)
        }
      }
    })
  }

  submitFcn(nodes) {
    var results = []
    for (var i=0; i<nodes.length; i++) {
      results.push({'id': nodes[i].id, 'audiofile': this.nodes[i].audiofile,
                    'values': [nodes[i].completed], 
                    'elapsed': this.audios[i].elapsed/this.audios[i].duration})
    }
    this.submitResults({'type': 'triplet', 'trial_id': this.trial_id,
                        'ratingtype': 'triplet', 'labels': [''],
                        'results': results, 'time': Date.now()-this.time_0},
                        this.nextURL)
  }

}

class FreesortGraph extends SquareAudioGraph {

  constructor(data, parentId, audioContainerId, buttonContainerId,
              isJsPsych, params) {
    super(data, parentId, audioContainerId, buttonContainerId, isJsPsych, params)
    this.r = this.width/2-30
    this.num_col = params.label.length
    this.box_width = (this.r*2-45-(this.num_col-1)*params.item_spacing)/this.num_col
    this.box_height = this.box_width
    this.ypos = makeArray(30+this.box_width/2,this.r*2-this.box_width/2+30,this.num_col)
    this.ypos_show = [this.ypos[0]]
    this.xpos = makeArray(30+this.box_width/2,this.r*2-this.box_width/2+30,this.num_col)
    this.feature_labels = params.label
  }

  // addRow() {
  //   if (this.ypos_show.length<this.ypos.length) {
  //     var i_0 = this.ypos_show.length
  //     this.ypos_show = this.ypos.slice(0,this.ypos_show.length+1)
  //     this.drawBorder(this.svg, i_0)
  //   }
  // }
  //
  // build() {
  //   super.build()
  //   this.row_btn = document.createElement("BUTTON");
  //   this.row_btn.innerHTML = 'Add row'
  //   this.row_btn.className += this.buttonClass
  //   this.row_btn.addEventListener("click", this.addRow.bind(this))
  //   this.row_btn.disabled = true
  //   document.getElementById(this.buttonContainerId).appendChild(this.row_btn)
  // }

  startFcn() {
    super.startFcn()
    // this.row_btn.disabled = false
  }

  edgeUpdate(self, d, i, x, y) {
  }

  edgeHide(self) {
  }

  drawBorder(svg, i_0=0) {
    var i, j
    for (i=i_0; i<this.ypos_show.length; i++) {
      for (j=0; j<this.xpos.length; j++) {
        var borderPath = svg.append("rect")
                            .attr('id', this.parentID+'-drop-box')
                              .attr("x", this.xpos[j]-this.box_width/2)
                              .attr("y", this.ypos[i]-this.box_height/2)
                            .attr("rx", 10)
                            .attr("ry", 10)
                              .attr("height", this.box_height)
                              .attr("width", this.box_width)
                            .style("stroke", "black")
                            .style("fill", "none")
        this.addText(this.xpos[j], this.ypos[i]+20+this.box_height/2, this.feature_labels[j])
      }
    }
  }

  submitFcn() {
    var results = []
    for (var i=0; i<this.nodes.length; i++) {
      var x = this.nodes[i].x
      var y = this.nodes[i].y
      var pos = closest(x,y,this.xpos,this.ypos,1e5)
      var category = pos[0]+this.num_col*(pos[1])
      results.push({'id': this.nodes[i].id, 'audiofile': this.nodes[i].audiofile,
                    'values': [category], 
                    'elapsed': this.audios[i].elapsed/this.audios[i].duration})
    }
    this.submitResults({'type': 'freesort', 'trial_id': this.trial_id,
                        'ratingtype': 'categories', 'labels': this.feature_labels,
                        'results': results, 'time': Date.now()-this.time_0},
                        this.nextURL)
  }

  boundary(self,x,y,i) {
    var newpos = closest(x, y, this.xpos, this.ypos_show, 1e7)
    newpos[0] = this.xpos[newpos[0]]
    newpos[1] = this.ypos[newpos[1]]
    var xdiff = x-newpos[0]
    var ydiff = y-newpos[1]
    newpos[0] = newpos[0] + Math.sign(xdiff) * Math.min(Math.abs(xdiff),this.box_width/2)
    newpos[1] = newpos[1] + Math.sign(ydiff) * Math.min(Math.abs(ydiff),this.box_height/2)
    return newpos
  }

}

class FeatureRatings2D extends SquareAudioGraph {

  constructor(data, parentId, audioContainerId, buttonContainerId,
              isJsPsych, params) {
    super(data, parentId, audioContainerId, buttonContainerId, isJsPsych, params)
    this.feature_labels = params.label
    this.feature_anchors = params.anchors
    this.r = (this.r+30)*.8-30
    this.h = this.h*.8
    this.k = this.k*.8
    this.edge_on_hover = false
  }

  drawBorder(svg) {
    super.drawBorder(svg)
    var j
    var ypos = 60+this.r*2
    var xpos = 40+this.r*2
    this.addText(this.h, ypos, this.feature_labels[0])
    for (j=0; j<3; j++) {
      this.addText(this.h-this.r+this.r*j, ypos-20, this.feature_anchors[0][j], 12)
    }
    this.addText(xpos, this.h, this.feature_labels[1], 15, 'start')
    for (j=0; j<3; j++) {
      this.addText(xpos, this.h+15-this.r+this.r*j*.9, this.feature_anchors[1][j], 12, 'start')
    }
  }

  edgeUpdate(self, d, i, x, y) {

    self.edges.each(function(l, li) {
      var stroke_params = self.getStroke(self, this, l, i)
      if (l.source == i) {
        d3.select(this).attr("x1", d.x = x).attr("y1", d.y = y);
        d3.select(this).attr("x2", d.x = self.r*2+30-10).attr("y2", d.y = y);
      } else if (l.target == i) {
        d3.select(this).attr("x1", d.x = x).attr("y1", d.y = y);
        d3.select(this).attr("x2", d.x = x).attr("y2", d.y = self.r*2+30-10);
      }
      d3.select(this).attr("stroke", stroke_params[0])
      d3.select(this).attr("stroke-width", stroke_params[1])
    });

  }

  getStroke(self, edge, l, i) {
    if ((l.source == i)|(l.target == i)) {
      // var stroke = 'rgba(0,0,0,1)'
      // var stroke_width = .5
      var stroke = self.getStrokeOn()
    } else {
      // var stroke = 'rgba(0,0,0,0)'
      // var stroke_width = 1
      var stroke = self.getStrokeOff()
    }
    return stroke
  }

  dragended(self, circle, d, i) {
     d3.select(circle).classed("active", false);
     var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
     d3.select(circle).attr("cx", d.x = newpos[0]).attr("cy", d.y = newpos[1])
     // Important to update to original positions
     super.edgeUpdate(self, d, i, newpos[0], newpos[1])
     self.edgeHide(self)
     if (self.all_in(self)) {
       self.readyFcn()
     }
     self.handle_dragend(self, circle, d, i)
  }

  layout() {
    var alphas = makeArray(30,30+this.r*2,this.num_items)
    this.links = []
    var i, j, link
    for (i=0; i<this.nodes.length; i++) {
      if (this.nodes[i].x=='') {
        this.nodes[i].x = alphas[i]
        this.nodes[i].y = 15
      }
      // Important to draw ALL links
      for (j=0; j<this.nodes.length; j++) {
        link = {source: i, target: j}
        this.links.push(link)
      }
    }
  }

  submitFcn() {
    var results = []
    for (var i=0; i<this.nodes.length; i++) {
      var x = (this.nodes[i].x-30)/this.r/2
      var y = (this.nodes[i].y-30)/this.r/2
      results.push({'id': this.nodes[i].id, 'audiofile': this.nodes[i].audiofile,
                    'values': [x, y], 
                    'elapsed': this.audios[i].elapsed/this.audios[i].duration})
    }
    this.submitResults({'type': 'features2d', 'trial_id': this.trial_id,
                        'ratingtype': 'features2d', 'labels': this.feature_labels,
                        'results': results, 'time': Date.now()-this.time_0},
                        this.nextURL)
  }

  // mouseover(self, circle, style, d, i) {
  //   // check if context is in suspended state (autoplay policy)
  //   // if (self.audioCtx.state === 'suspended') {
  //   //     self.audioCtx.resume();
  //   // }
  //   if (self.play) {
  //     if (self.player) {
  //       self.player.pause()
  //     }
  //     self.player = document.getElementById("page-audio-"+circle.id)
  //     self.player.play()
  //     d3.select(circle)
  //      .attr("r", self.circle_size_2(self, d))
  //      .style("stroke", style.border_color_2)
  //      .style("stroke-width", style.border_width_2)
  //   }
  //   self.edgeUpdate(self, d, i, d.x, d.y)
  // }
  //
  // mouseout(self, circle, style, d) {
  //   self.edgeHide(self)
  //   self.player.pause()
  //   self.player.currentTime = 0
  //   d3.select(circle)
  //     // .attr("r", self.circle_size_1())
  //     .attr("r", self.circle_size_1(self, d))
  //     .style("stroke", style.border_color_1)
  //     .style("stroke-width", style.border_width_1)
  //   super.edgeUpdate(self, d, i, d.x, d.y)
  // }

}

class FeatureRatings extends SquareAudioGraph {

  constructor(data, parentId, audioContainerId, buttonContainerId, 
              isJsPsych, params) {
    var num_features = params.label.length
    var num_audio = data.nodes.length
    var nodescopy = []
    var i, j
    for (i=0; i<data.nodes.length; i++) {
      for (j=0; j<num_features; j++) {
        nodescopy.push({'id': data.nodes[i].id, 'audiofile': data.nodes[i].audiofile, 
                        'x': data.nodes[i].x, 'y': [], 'audioindex': i})
      }
    }
    data.nodes = nodescopy
    super(data, parentId, audioContainerId, buttonContainerId, isJsPsych, params)
    this.r = this.width/2-60
    this.feature_height = num_audio*params.item_spacing
    if (num_features>1) {
      this.ypos = makeArray(30+this.feature_height, 30+70*(num_features-1)+this.feature_height*(num_features*2-1), num_features)
    } else {
      this.ypos = [30+this.feature_height]
    }
    this.feature_labels = params.label
    this.feature_anchors = params.anchors
    if (num_audio>1) {
      this.ympos = makeArray(-this.feature_height, this.feature_height, Math.floor(this.num_items/num_features))
    } else {
      this.ympos = [0]
    }
    this.num_features = num_features
    this.num_audio = num_audio
    this.height = this.ypos.slice(-1)[0]+this.ympos.slice(-1)[0]+30
    this.edge_on_hover = true
  }

  submitFcn() {
    var results = []
    for (var i=0; i<this.num_audio; i++) {
      results.push({'id': this.nodes[i*this.num_features].id,
                    'audiofile': this.nodes[i*this.num_features].audiofile,
                    'values': [], 
                    'elapsed': this.audios[i].elapsed/this.audios[i].duration})
      for (var j=0; j<this.num_features; j++) {
        var x = (this.nodes[i*this.num_features+j].x-this.h+this.r)/this.r/2
        results[i].values.push(x)
      }
    }
    this.submitResults({'type': 'features', 'trial_id': this.trial_id,
                        'ratingtype': 'features', 'labels': this.feature_labels,
                        'results': results, 'time': Date.now()-this.time_0},
                        this.nextURL)
  }

  num_colors() {
    return this.num_audio
  }

  drawBorder(svg) {
    var i, j
    for (i=0; i<this.num_features; i++) {
      var ypos = this.ypos[i]-this.feature_height
      var borderPath = svg.append("rect")
                          .attr('id', this.parentID+'-drop-box')
                            .attr("x", 45)
                            .attr("y", ypos)
                          .attr("rx", 10)
                          .attr("ry", 10)
                            .attr("height", this.feature_height*2)
                            .attr("width", this.r*2+30)
                          .style("stroke", 'black')
                          .style("fill", "none")
      this.addText(this.h, ypos-19, this.feature_labels[i])
      for (j=0; j<3; j++) {
        this.addText(this.h-this.r+this.r*j, ypos+20+this.feature_height*2, this.feature_anchors[i][j], 12)
      }
    }
  }

  is_in(self, x, y) {
    return x>=(self.h-self.r)
  }

  colorSelect(self, i, colorpalette) {
    return colorpalette(Math.floor(i/self.num_features))
  }

  layout() {
    var alphas = makeArray(90,this.r*2-30,this.num_audio)
    this.links = []
    var i, j, link
    for (i=0; i<this.nodes.length; i++) {
      var i_audio = Math.floor(i/this.num_features)
      if (this.nodes[i].x=='') {
        this.nodes[i].x = 30
      }
      this.nodes[i].y = this.ypos[i%this.num_features] + this.ympos[i_audio]
      for (j=i+1; j<this.nodes.length; j++) {
        if ((this.nodes[i].id==this.nodes[j].id) & (Math.abs(i-j)==1)) {
          link = {source: i, target: j}
          this.links.push(link)
        }
      }
    }
  }

  getStroke(self, edge, l, i) {
    return getStrokeSame(self, edge, l, i)
  }

  // dragstarted(self, circle, d, i) {
  //    d3.select(circle).raise().classed("active", true);
  //    console.log(i)
  //    // var circles = self.svg.selectAll("circle")._groups[0]
  //    // for (i=0; i<circles.length; i++) {
  //    //   if (circles[i].id==d.id) {
  //    //     var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
  //    //     d3.select(circles[i]).attr("cx", self.nodes[i].x = newpos[0])
  //    //                          .attr("cy", self.nodes[i].y = newpos[1]);
  //    //     var ii = i
  //    //   }
  //    // }
  //    // self.edgeUpdate(self, self.nodes[ii], ii, newpos[0], newpos[1])
  // }

  // dragged(self, circle, d, i) {
  //    var circles = self.svg.selectAll("circle")._groups[0]
  //    var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
  //    d3.select(circle).attr("cx", d.x = newpos[0]).attr("cy", d.y = newpos[1]);
  //    var j
  //    for (j=0; j<circles.length; j++) {
  //      // console.log(circles[j].)
  //      if (circles[j].id==d.id) {
  //        var newposj = self.boundary(self, circles[j].cx.animVal.value,
  //                                          circles[j].cy.animVal.value, j)
  //        d3.select(circles[j]).attr("cx", newposj[0])
  //                             .attr("cy", circles[j].cy.animVal.value);
  //        self.edgeUpdate(self, circles[j], j, newposj[0], circles[j].cy.animVal.value)
  //      }
  //    }
  //    // self.edgeUpdate(self, d, i, newpos[0], newpos[1])
  // }

  boundary(self,x,y,i) {
    var newpos = super.boundary(self,x,y,i)
    // newpos[0] = Math.floor(newpos[0]/30)*30
    // if (x!=newpos[0]) {
    //   newpos[0] = this.h
    // }
    newpos[1] = this.ypos[i%self.num_features] + this.ympos[Math.floor(i/self.num_features)]
    return newpos
  }

}

class FeatureRatingsStatic extends FeatureRatings {
  setupDrag() {

  }
}

class AudioGraphStatic extends SquareAudioGraph {

  constructor(data, parentId, audioContainerId, buttonContainerId, 
    isJsPsych, params) {
      super(data, parentId, audioContainerId, buttonContainerId, isJsPsych, params)
      this.opacity = .85
  }

  circle_size_1(self, d) {
    return d.circle_size*10+1
  }

  setupDrag() {}

  layout() {
    this.links = []
    for (i=0; i<this.nodes.length; i++) {
      this.nodes[i].x = this.nodes[i].values[0]*this.r*.9+this.h
      this.nodes[i].y = this.nodes[i].values[1]*this.r*.9+this.k
    }
  }

  build() {
    if (this.buttonContainerId.length==0) {
      this.startFcn()
    } else {
      this.start_btn = document.createElement("BUTTON");
      this.start_btn.innerHTML = 'Plot'
      this.start_btn.className += this.buttonClass
      this.start_btn.addEventListener("click", this.startFcn.bind(this))
      document.getElementById(this.buttonContainerId).appendChild(this.start_btn)
    }
  }

  num_colors() {
    return 20
  }

  colorSelect(self, i, colorpalette) {
    // console.log(self.nodes[i].i_group)
    return colorpalette(self.nodes[i].i_group)
    // return self.nodes[i].color
  }

}

class AudioGraphMultipleStatic extends AudioGraphStatic {

  constructor(data, parentId, audioContainerId, buttonContainerId='', draw_edges=false,
              trial_id='', width=400, nextURL='', opacity=1., isJsPsych=false, loop=true) {
    super(data, parentId, audioContainerId, buttonContainerId, draw_edges,
          trial_id, width, nextURL, opacity=opacity, isJsPsych, loop)

    this.height = width/2

    var num_plots = 2
    var nodescopy = []
    var i, j
    for (i=0; i<this.nodes.length; i++) {
      for (j=0; j<num_plots; j++) {
        var node = $.extend( true, {}, this.nodes[i] );
        node.x = this.nodes[i].values[0+j*2]
        node.y = this.nodes[i].values[1+j*2]
        nodescopy.push(node)
      }
    }
    this.nodes = nodescopy
    this.h = this.h/2
    this.k = this.k/2
    this.r = this.r/2

  }

  layout() {
    var i,j,link
    this.links = []
    for (i=0; i<this.nodes.length; i++) {
      this.nodes[i].x = this.nodes[i].x*this.r*.9+this.h + (i%2)*(30*1.5+2*this.r)
      this.nodes[i].y = this.nodes[i].y*this.r*.9+this.k
      for (j=i+1; j<this.nodes.length; j++) {
        if ((this.nodes[i].id==this.nodes[j].id) & (Math.abs(i-j)==1)) {
          link = {source: i, target: j}
          this.links.push(link)
        }
      }
    }
  }

  getStroke(self, edge, l, i) {
    return getStrokeSame(self, edge, l, i)
  }

  drawBorder(svg) {
    var borderPath = svg.append("rect")
                        .attr('id', this.parentID+'-drop-box')
                          .attr("x", 15)
                          .attr("y", 15)
                        .attr("rx", 10)
                        .attr("ry", 10)
                          .attr("height", this.r*2)
                          .attr("width", this.r*2)
                        .style("stroke", 'black')
                        .style("fill", "none")
    var borderPath2 = svg.append("rect")
                        .attr('id', this.parentID+'-drop-box')
                          .attr("x", 30*2+2*this.r)
                          .attr("y", 15)
                        .attr("rx", 10)
                        .attr("ry", 10)
                          .attr("height", this.r*2)
                          .attr("width", this.r*2)
                        .style("stroke", 'black')
                        .style("fill", "none")
  }

}

class AudioGraphStatic3d extends AudioGraphStatic {

  constructor(data, parentId, audioContainerId, buttonContainerId, 
    isJsPsych, params) {
      super(data, parentId, audioContainerId, buttonContainerId, isJsPsych, params)    
  // constructor(data, parentId, audioContainerId, buttonContainerId='', draw_edges=false,
  //             trial_id='', width=400, nextURL='', opacity=1., isJsPsych=false, loop=true) {
  //   super(data, parentId, audioContainerId, buttonContainerId, draw_edges,
  //         trial_id, width, nextURL, opacity=opacity, isJsPsych, loop)
    var startAngle = Math.PI, scale = 1, key = function(d){ return d.id; }
    this.startAngle = startAngle
    this.xangle = startAngle
    this.yangle = -startAngle
    this.scale = scale
    this.key = key
    var xLine = []
    var yLine = []
    var zLine = []
    var r = this.r*.6
    var o = r
    d3.range(-1.5*r, 1.5*r, r/10).forEach(function(d){ xLine.push([-d, -o, -o]); });
    d3.range(-1.5*r, 1.5*r, r/10).forEach(function(d){ yLine.push([-o, -d, -o]); });
    d3.range(-1.5*r, 1.5*r, r/10).forEach(function(d){ zLine.push([-o, -o, -d]); });
    this.lines = [xLine, yLine, zLine]
  }

  drawBorder(svg) {
  }

  point3d(){
    return d3._3d()
        .x(function(d){ return d.x; })
        .y(function(d){ return d.y; })
        .z(function(d){ return d.z; })
        .origin([this.h, this.k])
        .rotateCenter([0,0,0])
        .rotateY(this.xangle)
        .rotateX(this.yangle)
        .scale(this.scale);
  }

  line3d(){
    return d3._3d()
        .shape('LINE_STRIP')
        .origin([this.h, this.k])
        .rotateCenter([0,0,0])
        .rotateY(this.xangle)
        .rotateX(this.yangle)
        .scale(this.scale);
  }

  setupDrag() {
    var svg = d3.select('#'+this.parentId+'-svg')
    var self = this
    svg.call(d3.drag()
      .on("start", function(d) {
        self.dragstarted(self)
      })
      .on("drag", function(d, i) {
        self.dragged(self)
      })
      .on("end", function(d, i) {
        self.dragended(self)
      })
    );
    // var zoom = d3.zoom()
    //     .scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
    //     .extent([[0, 0], [this.r*2, this.r*2]])
    //     .on("zoom", self.zoom(self, function() {
    //       return zoom(self, d3.event.transform.k)
    //     }));
    // svg.call(zoom)
  }

  zoom(self, k) {
    self.scale = k
    console.log(self.scale)
    var svg = d3.select('#'+self.parentId+'-svg')
    self.update_nodes(self, svg)
  }

  dragstarted(self){
    self.mx = d3.event.x;
    self.my = d3.event.y;
    self.is_dragged = true
  }

  dragged(self){
    var beta, alpha, mouseX, mouseY
    self.mouseX = self.mouseX || 0;
    self.mouseY = self.mouseY || 0;
    beta   = (d3.event.x - self.mx + self.mouseX) * Math.PI / 230 ;
    alpha  = (d3.event.y - self.my + self.mouseY) * Math.PI / 230  * (-1);
    self.yangle = alpha - self.startAngle
    self.xangle = beta + self.startAngle
    var svg = d3.select('#'+self.parentId+'-svg')
    self.update_nodes(self, svg)
  }

  dragended(self){
    self.mouseX = d3.event.x - self.mx + self.mouseX;
    self.mouseY = d3.event.y - self.my + self.mouseY;
    self.is_dragged = false
  }

  update_nodes(self, svg) {
    var colorpalette = self.get_colorpalette(self)
    svg.selectAll('circle').data(self.point3d()(self.nodes))
                           .attr('cx', function(d){return d.projected.x})
                           .attr('cy', function(d){return d.projected.y})
                           .attr("class", "_3d node")
                           .attr("fill", function(d, i) {return self.colorSelect(self, i, colorpalette)})
                           .attr("id", function(d) {return d.id})
                           .attr("r", function(d, i) {return self.circle_size_1(self, d)})
   // circles.exit().remove();

   // d3.selectAll('circle').sort(d3._3d().sort);

   var i
   var scales = ['x','y','z']
   for (i=0; i<3; i++) {
     var xScale = svg.selectAll("path."+scales[i]+"Scale")
                     .data(self.line3d()([self.lines[i]]))
     xScale
         .enter()
         .append('path')
         .attr('class', '_3d '+scales[i]+'Scale')
         .merge(xScale)
         .attr('stroke', 'black')
         .attr('stroke-width', 1.)
         .attr('d', self.line3d().draw);
   }

   d3.selectAll('._3d').sort(d3._3d().sort);
  }

  layout() {
    this.links = []
    for (i=0; i<this.nodes.length; i++) {
      this.nodes[i].x = this.nodes[i].values[0]*this.r*.6//+this.h
      this.nodes[i].y = this.nodes[i].values[1]*this.r*.6//+this.k
      this.nodes[i].z = this.nodes[i].values[2]*this.r*.6//+this.k
    }
  }

  draw_nodes(self, svg) {
    var colorpalette = self.get_colorpalette(self)

    var i
    var scales = ['x','y','z']
    for (i=0; i<3; i++) {
      var xScale = svg.selectAll("path."+scales[i]+"Scale")
                      .data(self.line3d()([self.lines[i]]))
      xScale
          .enter()
          .append('path')
          .attr('class', '_3d '+scales[i]+'Scale')
          .merge(xScale)
          .attr('stroke', 'black')
          .attr('stroke-width', 1.)
          .attr('d', self.line3d().draw)
      xScale.exit().remove();
    }

    // console.log(self.line3d()([yLine]))

    var circles = svg.selectAll("node")
                     .data(self.point3d()(self.nodes), self.key)
    circles
      .enter()
      .append("circle")
      .attr("class", "_3d node")
      .attr('opacity', .85)
      .attr("cx", function(d) {return d.projected.x})
      .attr("cy", function(d) {return d.projected.y})
      // .merge(circles)
      // .transition().duration(100)
      .attr("fill", function(d, i) {return self.colorSelect(self, i, colorpalette)})
      .attr("id", function(d) {return d.id})
      .attr("r", function(d, i) {return self.circle_size_1(self, d)})
      .style("stroke", 'black')
      .style("stroke-width", self.style.border_width_1)
      // .attr('opacity', 1)
      // .attr("cx", function(d) {return d.projected.x})
      // .attr("cy", function(d) {return d.projected.y})
    // circles.exit().remove();
    d3.selectAll('._3d').sort(d3._3d().sort);
    // d3.selectAll('.path').sort(d3._3d().sort);
    return circles
  }

}

function getStrokeSame(self, edge, l, i) {
  if (self.draw_edges) {
    var id = self.nodes[i].id
    if (self.nodes[l.source].id==id) {
      var stroke = 'rgba(0,0,0,1)'
      var stroke_width = 1
    } else {
      var stroke = 'rgba(0,0,0,0)'
      var stroke_width = 1
    }
  } else {
    var stroke = 'rgba(0,0,0,0)'
    var stroke_width = 1
  }
  return [stroke, stroke_width]
}

function edgeLength(edge) {
  x1 = edge.x1.animVal.value
  x2 = edge.x2.animVal.value
  y1 = edge.y1.animVal.value
  y2 = edge.y2.animVal.value
  return computeLength(x1, x2, y1, y2)
}

function computeLength(x1, x2, y1, y2) {
  return Math.sqrt((x1-x2)**2+(y1-y2)**2)
}

function showPlaybackTools(data, audiofile_id, loop) {
    // Audio Player
    let url;
    if (data instanceof Blob) {
        const blob = new Blob(data, { type: mimeType });
        url = (URL.createObjectURL(blob));
    } else {
        url = data;
    }
    let player = document.getElementById("page-audio-"+audiofile_id)
    player.src = url;
    player.loop = loop; // True or False
}

function requestAudio(audiofile_id, url="") {
  if (url.length==0) {
    var audio_url = window.location.origin+'/get_audio'
  } else {
    var audio_url = url+'/get_audio'
  }
  $.ajax({
      url: audio_url,
      dataType: 'json',
      type: 'post',
      contentType: 'application/json',
      data: JSON.stringify(
        {'audiofile_id': audiofile_id}
      ),
      processData: false,
      success: function( data, textStatus, jQxhr ){
          showPlaybackTools(data.audio.type+';'+data.audio.data, audiofile_id, true)
      },
      error: function( jqXhr, textStatus, errorThrown ){
          console.log( errorThrown );
      }
  });
}

function makeArray(startValue, stopValue, cardinality) {
  var arr = [];
  var step = (stopValue - startValue) / (cardinality - 1);
  for (var i = 0; i < cardinality; i++) {
    arr.push(startValue + (step * i));
  }
  return arr;
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function closest(x, y, xpos, ypos, max=1e6) {
  var distance = max
  var xsel, ysel
  for (i=0; i<xpos.length; i++) {
      for (j=0; j<ypos.length; j++) {
          d = Math.sqrt((x-xpos[i])**2+(y-ypos[j])**2)
          if (d<distance) {
            distance = d
            xsel = i
            ysel = j
          }
      }
  }
  return [xsel, ysel]
}

function requestAudioFiles(sentence_id, num_audiofiles, readyFcn) {
  var request_url = window.location.origin+'/get_audiofiles_sentence'
  var data = JSON.stringify(
    {'sentence_id': sentence_id,
     'num_audiofiles': num_audiofiles}
  )
  $.ajax({
      url: request_url,
      dataType: 'json',
      type: 'post',
      contentType: 'application/json',
      data: data,
      processData: false,
      success: function( audiofile_ids, textStatus, jQxhr ){
          document.getElementById('audiofile-ids').innerHTML = JSON.stringify(audiofile_ids)
          readyFcn(audiofile_ids)
      },
      error: function( jqXhr, textStatus, errorThrown ){
          console.log( errorThrown );
      }
  });
}

function submitResults(results, nextURL='') {
  var submit_url = window.location.origin+'/post_trial'
  $.ajax({
        url: submit_url,
        dataType: 'json',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify( results ),
        processData: false,
        success: function( data, textStatus, jQxhr ){
            // url = new URL(current_url)
            // url.searchParams.set("numfiles",String(num_audiofiles))
            if (nextURL=='') {
              location.reload();
            } else {
              window.location.href = nextURL
            }
        },
        error: function( jqXhr, textStatus, errorThrown ){
            console.log( errorThrown );
        }
    });
}

function submitResultsJsPsych(results, nextURL) {
  // end trial
  // 'nextURL' variable is used to pass 'display_element' from jsPsych...

  var trial_data = {
    stimuli: [],
    ratings: [],
    elapsed: [],
    rt: results.time,
    ratingtype: results.ratingtype,
    labels: results.labels
  }
  for (var i=0; i<results.results.length; i++){
    trial_data.stimuli.push(results.results[i].audiofile)
    trial_data.elapsed.push(results.results[i].elapsed)
    if (results.results[i].values.length==1){
      trial_data.ratings.push(results.results[i].values[0])
    } else {
      trial_data.ratings.push(results.results[i].values)
    }
  }
  nextURL.innerHTML = '';
  var version = this.jsPsych.version()
  if (parseInt(version.split('.')[0])>=7) {
    this.jsPsych.finishTrial(trial_data);
  } else {
    jsPsych.finishTrial(trial_data);
  }
}
